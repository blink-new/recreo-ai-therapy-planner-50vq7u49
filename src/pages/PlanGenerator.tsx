import { useState } from 'react'
import { 
  Sparkles, 
  User, 
  Target, 
  Activity, 
  FileText,
  Download,
  Save,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { blink } from '@/blink/client'

export function PlanGenerator() {
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    diagnosis: '',
    functionalLevel: '',
    primaryGoal: '',
    secondaryGoals: '',
    interests: '',
    limitations: '',
    sessionDuration: '60',
    frequency: 'weekly',
    duration: '8'
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generatePlan = async () => {
    setIsGenerating(true)
    try {
      const prompt = `Create a comprehensive recreational therapy plan for:

Patient Information:
- Name: ${formData.patientName}
- Age: ${formData.age}
- Diagnosis: ${formData.diagnosis}
- Functional Level: ${formData.functionalLevel}

Goals:
- Primary Goal: ${formData.primaryGoal}
- Secondary Goals: ${formData.secondaryGoals}

Patient Profile:
- Interests: ${formData.interests}
- Limitations: ${formData.limitations}

Session Details:
- Duration: ${formData.sessionDuration} minutes
- Frequency: ${formData.frequency}
- Program Duration: ${formData.duration} weeks

Please provide a detailed therapy plan with specific activities, objectives, and progress measures.`

      const { object: plan } = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: {
            planTitle: { type: 'string' },
            overview: { type: 'string' },
            objectives: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  goal: { type: 'string' },
                  measurableOutcome: { type: 'string' },
                  timeframe: { type: 'string' }
                }
              }
            },
            activities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  duration: { type: 'string' },
                  materials: { type: 'array', items: { type: 'string' } },
                  adaptations: { type: 'string' },
                  progressMeasures: { type: 'string' }
                }
              }
            },
            weeklySchedule: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  week: { type: 'number' },
                  focus: { type: 'string' },
                  activities: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            assessmentMethods: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      })

      setGeneratedPlan(plan)
      setStep(3)
    } catch (error) {
      console.error('Error generating plan:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const savePlan = async () => {
    try {
      const user = await blink.auth.me()
      
      await blink.db.therapyPlans.create({
        userId: user.id,
        patientName: formData.patientName,
        patientAge: parseInt(formData.age),
        diagnosis: formData.diagnosis,
        primaryGoal: formData.primaryGoal,
        planData: JSON.stringify(generatedPlan),
        status: 'active',
        createdAt: new Date().toISOString()
      })

      // Also save patient profile if it doesn't exist
      const existingPatients = await blink.db.patients.list({
        where: { 
          userId: user.id,
          name: formData.patientName 
        }
      })

      if (existingPatients.length === 0) {
        await blink.db.patients.create({
          userId: user.id,
          name: formData.patientName,
          age: parseInt(formData.age),
          diagnosis: formData.diagnosis,
          functionalLevel: formData.functionalLevel,
          interests: formData.interests,
          limitations: formData.limitations,
          createdAt: new Date().toISOString()
        })
      }

      alert('Plan saved successfully!')
    } catch (error) {
      console.error('Error saving plan:', error)
      alert('Error saving plan. Please try again.')
    }
  }

  const resetForm = () => {
    setStep(1)
    setFormData({
      patientName: '',
      age: '',
      diagnosis: '',
      functionalLevel: '',
      primaryGoal: '',
      secondaryGoals: '',
      interests: '',
      limitations: '',
      sessionDuration: '60',
      frequency: 'weekly',
      duration: '8'
    })
    setGeneratedPlan(null)
  }

  if (step === 3 && generatedPlan) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generated Therapy Plan</h1>
            <p className="text-gray-500">AI-generated personalized therapy plan for {formData.patientName}</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={resetForm}>
              <RefreshCw className="w-4 h-4 mr-2" />
              New Plan
            </Button>
            <Button onClick={savePlan}>
              <Save className="w-4 h-4 mr-2" />
              Save Plan
            </Button>
          </div>
        </div>

        {/* Plan Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>{generatedPlan.planTitle}</CardTitle>
                <CardDescription>Therapy Plan Overview</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{generatedPlan.overview}</p>
              </CardContent>
            </Card>

            {/* Objectives */}
            <Card>
              <CardHeader>
                <CardTitle>Treatment Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generatedPlan.objectives?.map((objective: any, index: number) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <h4 className="font-medium text-gray-900">{objective.goal}</h4>
                      <p className="text-sm text-gray-600 mt-1">{objective.measurableOutcome}</p>
                      <Badge variant="outline" className="mt-2">{objective.timeframe}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {generatedPlan.activities?.map((activity: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{activity.name}</h4>
                        <Badge>{activity.duration}</Badge>
                      </div>
                      <p className="text-gray-700 mb-3">{activity.description}</p>
                      
                      {activity.materials && activity.materials.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Materials Needed:</h5>
                          <div className="flex flex-wrap gap-1">
                            {activity.materials.map((material: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {material}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {activity.adaptations && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Adaptations:</h5>
                          <p className="text-sm text-gray-600">{activity.adaptations}</p>
                        </div>
                      )}
                      
                      {activity.progressMeasures && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Progress Measures:</h5>
                          <p className="text-sm text-gray-600">{activity.progressMeasures}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-gray-600">{formData.patientName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Age</Label>
                  <p className="text-sm text-gray-600">{formData.age} years</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Diagnosis</Label>
                  <p className="text-sm text-gray-600">{formData.diagnosis}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Functional Level</Label>
                  <p className="text-sm text-gray-600">{formData.functionalLevel}</p>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Schedule */}
            {generatedPlan.weeklySchedule && (
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {generatedPlan.weeklySchedule.map((week: any, index: number) => (
                      <div key={index} className="border-l-2 border-accent pl-3">
                        <h5 className="font-medium text-sm">Week {week.week}</h5>
                        <p className="text-xs text-gray-600 mb-1">{week.focus}</p>
                        <div className="space-y-1">
                          {week.activities?.map((activity: string, idx: number) => (
                            <p key={idx} className="text-xs text-gray-500">• {activity}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assessment Methods */}
            {generatedPlan.assessmentMethods && (
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generatedPlan.assessmentMethods.map((method: string, index: number) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-accent mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{method}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-full mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Therapy Plan Generator</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Create personalized recreational therapy plans powered by AI. Provide patient information 
          and goals to generate comprehensive, evidence-based treatment plans.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="ml-2 text-sm font-medium">Patient Info</span>
        </div>
        <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="ml-2 text-sm font-medium">Generate Plan</span>
        </div>
        <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
        <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            3
          </div>
          <span className="ml-2 text-sm font-medium">Review & Save</span>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Patient Information
            </CardTitle>
            <CardDescription>
              Provide detailed information about your patient to generate a personalized therapy plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="patientName">Patient Name *</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) => handleInputChange('patientName', e.target.value)}
                  placeholder="Enter patient's name"
                />
              </div>
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter age"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="diagnosis">Primary Diagnosis *</Label>
              <Input
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                placeholder="e.g., Stroke, TBI, Depression, Autism Spectrum Disorder"
              />
            </div>

            <div>
              <Label htmlFor="functionalLevel">Functional Level *</Label>
              <Select value={formData.functionalLevel} onValueChange={(value) => handleInputChange('functionalLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select functional level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="independent">Independent</SelectItem>
                  <SelectItem value="minimal-assistance">Minimal Assistance</SelectItem>
                  <SelectItem value="moderate-assistance">Moderate Assistance</SelectItem>
                  <SelectItem value="maximum-assistance">Maximum Assistance</SelectItem>
                  <SelectItem value="total-assistance">Total Assistance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="primaryGoal">Primary Treatment Goal *</Label>
              <Textarea
                id="primaryGoal"
                value={formData.primaryGoal}
                onChange={(e) => handleInputChange('primaryGoal', e.target.value)}
                placeholder="e.g., Improve fine motor skills, Increase social interaction, Enhance cognitive function"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="secondaryGoals">Secondary Goals</Label>
              <Textarea
                id="secondaryGoals"
                value={formData.secondaryGoals}
                onChange={(e) => handleInputChange('secondaryGoals', e.target.value)}
                placeholder="Additional treatment goals (optional)"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="interests">Patient Interests & Preferences</Label>
              <Textarea
                id="interests"
                value={formData.interests}
                onChange={(e) => handleInputChange('interests', e.target.value)}
                placeholder="e.g., Music, sports, art, games, outdoor activities"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="limitations">Physical/Cognitive Limitations</Label>
              <Textarea
                id="limitations"
                value={formData.limitations}
                onChange={(e) => handleInputChange('limitations', e.target.value)}
                placeholder="Any limitations or contraindications to consider"
                rows={2}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
                <Select value={formData.sessionDuration} onValueChange={(value) => handleInputChange('sessionDuration', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency">Session Frequency</Label>
                <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="3x-weekly">3x per week</SelectItem>
                    <SelectItem value="2x-weekly">2x per week</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Program Duration (weeks)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="8"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(2)}
                disabled={!formData.patientName || !formData.age || !formData.diagnosis || !formData.functionalLevel || !formData.primaryGoal}
                size="lg"
              >
                Continue to Generate Plan
                <Target className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Therapy Plan
            </CardTitle>
            <CardDescription>
              Review the information and generate your AI-powered therapy plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">Plan Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Patient:</span> {formData.patientName}, {formData.age} years
                </div>
                <div>
                  <span className="font-medium">Diagnosis:</span> {formData.diagnosis}
                </div>
                <div>
                  <span className="font-medium">Functional Level:</span> {formData.functionalLevel}
                </div>
                <div>
                  <span className="font-medium">Sessions:</span> {formData.sessionDuration} min, {formData.frequency}
                </div>
              </div>
              <div className="mt-4">
                <span className="font-medium">Primary Goal:</span>
                <p className="text-gray-600 mt-1">{formData.primaryGoal}</p>
              </div>
            </div>

            {isGenerating && (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Your Therapy Plan</h3>
                <p className="text-gray-500">AI is analyzing patient information and creating personalized recommendations...</p>
                <Progress value={66} className="w-64 mx-auto mt-4" />
              </div>
            )}

            {!isGenerating && (
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back to Edit
                </Button>
                <Button onClick={generatePlan} size="lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}