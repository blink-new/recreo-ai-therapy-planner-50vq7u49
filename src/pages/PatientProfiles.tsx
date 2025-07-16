import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { blink } from '@/blink/client'

interface Patient {
  id: string
  name: string
  age: number
  diagnosis: string
  functionalLevel: string
  interests: string
  limitations: string
  createdAt: string
  lastPlanDate?: string
  activePlans?: number
}

export function PatientProfiles() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    diagnosis: '',
    functionalLevel: '',
    interests: '',
    limitations: ''
  })

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    const filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredPatients(filtered)
  }, [patients, searchQuery])

  const loadPatients = async () => {
    try {
      const user = await blink.auth.me()
      
      let patientsData = []
      let plansData = []
      
      try {
        // Try to load from database first
        patientsData = await blink.db.patients.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        })
        
        plansData = await blink.db.therapyPlans.list({
          where: { userId: user.id }
        })
      } catch (dbError) {
        console.log('Database not available, using local storage fallback')
        
        // Fallback to localStorage
        const savedPatients = localStorage.getItem(`patients_${user.id}`)
        const savedPlans = localStorage.getItem(`therapy_plans_${user.id}`)
        
        if (savedPatients) {
          patientsData = JSON.parse(savedPatients)
        }
        if (savedPlans) {
          plansData = JSON.parse(savedPlans)
        }
      }

      // Get plan counts for each patient
      const patientsWithPlans = patientsData.map((patient: any) => {
        const patientPlans = plansData.filter((plan: any) => plan.patientName === patient.name)
        const activePlans = patientPlans.filter((plan: any) => plan.status === 'active').length
        const lastPlan = patientPlans.length > 0 ? patientPlans[0] : null
        
        return {
          ...patient,
          activePlans,
          lastPlanDate: lastPlan?.createdAt
        }
      })

      setPatients(patientsWithPlans)
    } catch (error) {
      console.error('Error loading patients:', error)
      setPatients([])
    }
  }

  const handleAddPatient = async () => {
    try {
      const user = await blink.auth.me()
      
      const patientData = {
        id: `patient_${Date.now()}`,
        userId: user.id,
        name: newPatient.name,
        age: parseInt(newPatient.age),
        diagnosis: newPatient.diagnosis,
        functionalLevel: newPatient.functionalLevel,
        interests: newPatient.interests,
        limitations: newPatient.limitations,
        createdAt: new Date().toISOString()
      }
      
      try {
        // Try to save to database first
        await blink.db.patients.create(patientData)
      } catch (dbError) {
        console.log('Database not available, saving to localStorage')
        
        // Fallback to localStorage
        const savedPatients = localStorage.getItem(`patients_${user.id}`)
        let patients = savedPatients ? JSON.parse(savedPatients) : []
        
        patients.push(patientData)
        localStorage.setItem(`patients_${user.id}`, JSON.stringify(patients))
      }

      setNewPatient({
        name: '',
        age: '',
        diagnosis: '',
        functionalLevel: '',
        interests: '',
        limitations: ''
      })
      setIsAddDialogOpen(false)
      loadPatients()
    } catch (error) {
      console.error('Error adding patient:', error)
    }
  }

  const handleEditPatient = async () => {
    if (!editingPatient) return
    
    try {
      const user = await blink.auth.me()
      
      const updatedData = {
        name: newPatient.name,
        age: parseInt(newPatient.age),
        diagnosis: newPatient.diagnosis,
        functionalLevel: newPatient.functionalLevel,
        interests: newPatient.interests,
        limitations: newPatient.limitations
      }
      
      try {
        // Try to update in database first
        await blink.db.patients.update(editingPatient.id, updatedData)
      } catch (dbError) {
        console.log('Database not available, updating in localStorage')
        
        // Fallback to localStorage
        const savedPatients = localStorage.getItem(`patients_${user.id}`)
        if (savedPatients) {
          let patients = JSON.parse(savedPatients)
          const patientIndex = patients.findIndex((p: any) => p.id === editingPatient.id)
          
          if (patientIndex !== -1) {
            patients[patientIndex] = { ...patients[patientIndex], ...updatedData }
            localStorage.setItem(`patients_${user.id}`, JSON.stringify(patients))
          }
        }
      }

      setEditingPatient(null)
      setNewPatient({
        name: '',
        age: '',
        diagnosis: '',
        functionalLevel: '',
        interests: '',
        limitations: ''
      })
      loadPatients()
    } catch (error) {
      console.error('Error updating patient:', error)
    }
  }

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      return
    }

    try {
      const user = await blink.auth.me()
      
      try {
        // Try to delete from database first
        await blink.db.patients.delete(patientId)
      } catch (dbError) {
        console.log('Database not available, deleting from localStorage')
        
        // Fallback to localStorage
        const savedPatients = localStorage.getItem(`patients_${user.id}`)
        if (savedPatients) {
          let patients = JSON.parse(savedPatients)
          patients = patients.filter((p: any) => p.id !== patientId)
          localStorage.setItem(`patients_${user.id}`, JSON.stringify(patients))
        }
      }
      
      loadPatients()
    } catch (error) {
      console.error('Error deleting patient:', error)
    }
  }

  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient)
    setNewPatient({
      name: patient.name,
      age: patient.age.toString(),
      diagnosis: patient.diagnosis,
      functionalLevel: patient.functionalLevel,
      interests: patient.interests,
      limitations: patient.limitations
    })
  }

  const PatientForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Patient Name *</Label>
          <Input
            id="name"
            value={newPatient.name}
            onChange={(e) => setNewPatient(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter patient's name"
          />
        </div>
        <div>
          <Label htmlFor="age">Age *</Label>
          <Input
            id="age"
            type="number"
            value={newPatient.age}
            onChange={(e) => setNewPatient(prev => ({ ...prev, age: e.target.value }))}
            placeholder="Enter age"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="diagnosis">Primary Diagnosis *</Label>
        <Input
          id="diagnosis"
          value={newPatient.diagnosis}
          onChange={(e) => setNewPatient(prev => ({ ...prev, diagnosis: e.target.value }))}
          placeholder="e.g., Stroke, TBI, Depression"
        />
      </div>

      <div>
        <Label htmlFor="functionalLevel">Functional Level *</Label>
        <Select 
          value={newPatient.functionalLevel} 
          onValueChange={(value) => setNewPatient(prev => ({ ...prev, functionalLevel: value }))}
        >
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
        <Label htmlFor="interests">Interests & Preferences</Label>
        <Textarea
          id="interests"
          value={newPatient.interests}
          onChange={(e) => setNewPatient(prev => ({ ...prev, interests: e.target.value }))}
          placeholder="Patient's interests, hobbies, and preferences"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="limitations">Limitations & Considerations</Label>
        <Textarea
          id="limitations"
          value={newPatient.limitations}
          onChange={(e) => setNewPatient(prev => ({ ...prev, limitations: e.target.value }))}
          placeholder="Physical, cognitive, or other limitations to consider"
          rows={2}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Profiles</h1>
          <p className="text-gray-500">Manage patient information and track therapy progress</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Create a new patient profile to start generating therapy plans
              </DialogDescription>
            </DialogHeader>
            <PatientForm />
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddPatient}
                disabled={!newPatient.name || !newPatient.age || !newPatient.diagnosis || !newPatient.functionalLevel}
              >
                Add Patient
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Patients Grid */}
      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {patients.length === 0 ? 'No patients yet' : 'No patients found'}
            </h3>
            <p className="text-gray-500 mb-6">
              {patients.length === 0 
                ? 'Add your first patient to start creating therapy plans'
                : 'Try adjusting your search criteria'
              }
            </p>
            {patients.length === 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Patient
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary text-white">
                        {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{patient.name}</CardTitle>
                      <CardDescription>{patient.age} years old</CardDescription>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(patient)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeletePatient(patient.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Patient
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Diagnosis</Label>
                  <p className="text-sm text-gray-900">{patient.diagnosis}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Functional Level</Label>
                  <Badge variant="outline" className="mt-1">
                    {patient.functionalLevel.replace('-', ' ')}
                  </Badge>
                </div>

                {patient.interests && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Interests</Label>
                    <p className="text-sm text-gray-700 line-clamp-2">{patient.interests}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {patient.activePlans || 0} active plans
                    </div>
                    {patient.lastPlanDate && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(patient.lastPlanDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Patient Dialog */}
      <Dialog open={!!editingPatient} onOpenChange={() => setEditingPatient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Patient Profile</DialogTitle>
            <DialogDescription>
              Update patient information and preferences
            </DialogDescription>
          </DialogHeader>
          <PatientForm />
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setEditingPatient(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditPatient}
              disabled={!newPatient.name || !newPatient.age || !newPatient.diagnosis || !newPatient.functionalLevel}
            >
              Update Patient
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}