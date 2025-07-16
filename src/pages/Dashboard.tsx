import { useState, useEffect } from 'react'
import { 
  Users, 
  FileText, 
  Clock, 
  TrendingUp,
  Plus,
  Calendar,
  Activity,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { blink } from '@/blink/client'

interface DashboardProps {
  onTabChange: (tab: string) => void
}

export function Dashboard({ onTabChange }: DashboardProps) {
  const [recentPlans, setRecentPlans] = useState([])
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePlans: 0,
    completedSessions: 0,
    thisWeekPlans: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load recent therapy plans
      const plans = await blink.db.therapyPlans.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 5
      })
      setRecentPlans(plans)

      // Load patients
      const patients = await blink.db.patients.list({
        where: { userId: user.id }
      })

      // Calculate stats
      const activePlans = plans.filter(plan => plan.status === 'active').length
      const thisWeekPlans = plans.filter(plan => {
        const planDate = new Date(plan.createdAt)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return planDate >= weekAgo
      }).length

      setStats({
        totalPatients: patients.length,
        activePlans,
        completedSessions: 0, // This would come from session tracking
        thisWeekPlans
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      description: 'Active patient profiles',
      color: 'text-blue-600'
    },
    {
      title: 'Active Plans',
      value: stats.activePlans,
      icon: FileText,
      description: 'Currently in progress',
      color: 'text-green-600'
    },
    {
      title: 'This Week',
      value: stats.thisWeekPlans,
      icon: Calendar,
      description: 'Plans created this week',
      color: 'text-purple-600'
    },
    {
      title: 'Sessions',
      value: stats.completedSessions,
      icon: Activity,
      description: 'Completed sessions',
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-blue-100 text-lg mb-6">
            Ready to create personalized therapy plans for your patients? Let's get started.
          </p>
          <Button 
            onClick={() => onTabChange('generator')}
            className="bg-white text-primary hover:bg-gray-50"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Plan
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Plans */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Therapy Plans</CardTitle>
              <CardDescription>
                Your most recently created therapy plans
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => onTabChange('library')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentPlans.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No plans yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first therapy plan to get started
              </p>
              <Button onClick={() => onTabChange('generator')}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Plan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPlans.map((plan: any) => (
                <div 
                  key={plan.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{plan.patientName}</h4>
                    <p className="text-sm text-gray-500 mt-1">{plan.primaryGoal}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </div>
                      <Badge 
                        variant={plan.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {plan.status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Plan
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onTabChange('generator')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
              AI Plan Generator
            </CardTitle>
            <CardDescription>
              Create personalized therapy plans with AI assistance
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onTabChange('patients')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-accent" />
              Patient Profiles
            </CardTitle>
            <CardDescription>
              Manage patient information and track progress
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onTabChange('library')}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              Plan Library
            </CardTitle>
            <CardDescription>
              Browse templates and saved therapy plans
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}