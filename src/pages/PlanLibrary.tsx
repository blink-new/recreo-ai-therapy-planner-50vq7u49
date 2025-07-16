import { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Search, 
  Filter,
  Download,
  Eye,
  Copy,
  Trash2,
  Calendar,
  User,
  Target,
  MoreVertical
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { blink } from '@/blink/client'

interface TherapyPlan {
  id: string
  patientName: string
  patientAge: number
  diagnosis: string
  primaryGoal: string
  planData: string
  status: string
  createdAt: string
}

export function PlanLibrary() {
  const [plans, setPlans] = useState<TherapyPlan[]>([])
  const [filteredPlans, setFilteredPlans] = useState<TherapyPlan[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<TherapyPlan | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    let filtered = plans

    // Filter by tab
    if (activeTab === 'active') {
      filtered = filtered.filter(plan => plan.status === 'active')
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(plan => plan.status === 'completed')
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(plan =>
        plan.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.primaryGoal.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredPlans(filtered)
  }, [plans, searchQuery, activeTab])

  const loadPlans = async () => {
    try {
      const user = await blink.auth.me()
      
      let plansData = []
      
      try {
        // Try to load from database first
        plansData = await blink.db.therapyPlans.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        })
      } catch (dbError) {
        console.log('Database not available, using local storage fallback')
        
        // Fallback to localStorage
        const savedPlans = localStorage.getItem(`therapy_plans_${user.id}`)
        if (savedPlans) {
          plansData = JSON.parse(savedPlans)
          // Sort by createdAt desc
          plansData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }
      }
      
      setPlans(plansData)
    } catch (error) {
      console.error('Error loading plans:', error)
      setPlans([])
    }
  }

  const handleViewPlan = (plan: TherapyPlan) => {
    setSelectedPlan(plan)
    setViewDialogOpen(true)
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this therapy plan?')) {
      return
    }

    try {
      const user = await blink.auth.me()
      
      try {
        // Try to delete from database first
        await blink.db.therapyPlans.delete(planId)
      } catch (dbError) {
        console.log('Database not available, deleting from localStorage')
        
        // Fallback to localStorage
        const savedPlans = localStorage.getItem(`therapy_plans_${user.id}`)
        if (savedPlans) {
          let plans = JSON.parse(savedPlans)
          plans = plans.filter((p: any) => p.id !== planId)
          localStorage.setItem(`therapy_plans_${user.id}`, JSON.stringify(plans))
        }
      }
      
      loadPlans()
    } catch (error) {
      console.error('Error deleting plan:', error)
    }
  }

  const handleDuplicatePlan = async (plan: TherapyPlan) => {
    try {
      const user = await blink.auth.me()
      
      const duplicatedPlan = {
        id: `plan_${Date.now()}`,
        userId: user.id,
        patientName: `${plan.patientName} (Copy)`,
        patientAge: plan.patientAge,
        diagnosis: plan.diagnosis,
        primaryGoal: plan.primaryGoal,
        planData: plan.planData,
        status: 'draft',
        createdAt: new Date().toISOString()
      }
      
      try {
        // Try to save to database first
        await blink.db.therapyPlans.create(duplicatedPlan)
      } catch (dbError) {
        console.log('Database not available, saving to localStorage')
        
        // Fallback to localStorage
        const savedPlans = localStorage.getItem(`therapy_plans_${user.id}`)
        let plans = savedPlans ? JSON.parse(savedPlans) : []
        
        plans.unshift(duplicatedPlan)
        localStorage.setItem(`therapy_plans_${user.id}`, JSON.stringify(plans))
      }

      loadPlans()
      alert('Plan duplicated successfully!')
    } catch (error) {
      console.error('Error duplicating plan:', error)
    }
  }

  const getParsedPlanData = (planDataString: string) => {
    try {
      return JSON.parse(planDataString)
    } catch {
      return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const PlanCard = ({ plan }: { plan: TherapyPlan }) => {
    const planData = getParsedPlanData(plan.planData)
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{plan.patientName}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <span>{plan.patientAge} years</span>
                <span>•</span>
                <span>{plan.diagnosis}</span>
              </CardDescription>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewPlan(plan)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Plan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicatePlan(plan)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeletePlan(plan.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Primary Goal</Label>
            <p className="text-sm text-gray-900 line-clamp-2">{plan.primaryGoal}</p>
          </div>

          {planData?.planTitle && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Plan Title</Label>
              <p className="text-sm text-gray-900">{planData.planTitle}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(plan.createdAt).toLocaleDateString()}
              </div>
              {planData?.activities && (
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  {planData.activities.length} activities
                </div>
              )}
            </div>
            
            <Badge className={getStatusColor(plan.status)}>
              {plan.status}
            </Badge>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => handleViewPlan(plan)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Full Plan
          </Button>
        </CardContent>
      </Card>
    )
  }

  const PlanDetailView = ({ plan }: { plan: TherapyPlan }) => {
    const planData = getParsedPlanData(plan.planData)
    
    if (!planData) {
      return <div>Error loading plan data</div>
    }

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Plan Header */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">{planData.planTitle}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="font-medium">Patient:</Label>
              <p>{plan.patientName}, {plan.patientAge} years</p>
            </div>
            <div>
              <Label className="font-medium">Diagnosis:</Label>
              <p>{plan.diagnosis}</p>
            </div>
            <div>
              <Label className="font-medium">Status:</Label>
              <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
            </div>
            <div>
              <Label className="font-medium">Created:</Label>
              <p>{new Date(plan.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Overview */}
        {planData.overview && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Overview</h4>
            <p className="text-gray-700">{planData.overview}</p>
          </div>
        )}

        {/* Objectives */}
        {planData.objectives && planData.objectives.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Treatment Objectives</h4>
            <div className="space-y-3">
              {planData.objectives.map((objective: any, index: number) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <h5 className="font-medium">{objective.goal}</h5>
                  <p className="text-sm text-gray-600 mt-1">{objective.measurableOutcome}</p>
                  <Badge variant="outline" className="mt-2">{objective.timeframe}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Activities */}
        {planData.activities && planData.activities.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recommended Activities</h4>
            <div className="space-y-4">
              {planData.activities.map((activity: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{activity.name}</h5>
                    <Badge variant="secondary">{activity.duration}</Badge>
                  </div>
                  <p className="text-gray-700 mb-3">{activity.description}</p>
                  
                  {activity.materials && activity.materials.length > 0 && (
                    <div className="mb-2">
                      <Label className="text-sm font-medium">Materials:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {activity.materials.map((material: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {material}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {activity.adaptations && (
                    <div className="mb-2">
                      <Label className="text-sm font-medium">Adaptations:</Label>
                      <p className="text-sm text-gray-600">{activity.adaptations}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Schedule */}
        {planData.weeklySchedule && planData.weeklySchedule.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Weekly Schedule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {planData.weeklySchedule.map((week: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <h5 className="font-medium text-sm mb-1">Week {week.week}</h5>
                  <p className="text-xs text-gray-600 mb-2">{week.focus}</p>
                  <div className="space-y-1">
                    {week.activities?.map((activity: string, idx: number) => (
                      <p key={idx} className="text-xs text-gray-500">• {activity}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan Library</h1>
          <p className="text-gray-500">Browse and manage your therapy plans and templates</p>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Plans</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {plans.length === 0 ? 'No therapy plans yet' : 'No plans found'}
            </h3>
            <p className="text-gray-500 mb-6">
              {plans.length === 0 
                ? 'Create your first therapy plan to get started'
                : 'Try adjusting your search criteria or filters'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}

      {/* Plan Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Therapy Plan Details</DialogTitle>
            <DialogDescription>
              Complete therapy plan information and activities
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && <PlanDetailView plan={selectedPlan} />}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}