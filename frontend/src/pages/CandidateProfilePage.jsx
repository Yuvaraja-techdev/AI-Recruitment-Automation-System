import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  Github,
  Linkedin,
  Globe,
  Plus,
  Trash2,
  FileText,
  Upload,
  CheckCircle,
  BriefcaseBusiness,
  ArrowLeft,
  AlertCircle,
  Award,
  BookOpen,
  MapPin,
  IndianRupee
} from 'lucide-react'
import { getCandidateById, updateCandidateProfile, uploadCandidateResume, getResumeHistory, deleteCandidateResume } from '../services/api'

function CandidateProfilePage() {
  const navigate = useNavigate()
  const [candidateId, setCandidateId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [photo, setPhoto] = useState('')
  
  // Link fields
  const [github, setGithub] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [portfolio, setPortfolio] = useState('')

  // Additional profile fields (Module 2)
  const [location, setLocation] = useState('')
  const [preferredRoles, setPreferredRoles] = useState([])
  const [newRole, setNewRole] = useState('')
  const [preferredLocations, setPreferredLocations] = useState([])
  const [newPrefLocation, setNewPrefLocation] = useState('')
  const [expectedSalary, setExpectedSalary] = useState('')
  const [workPreference, setWorkPreference] = useState('Remote')

  // Dynamic Array lists
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  
  const [education, setEducation] = useState([]) // { school, degree, year }
  const [eduSchool, setEduSchool] = useState('')
  const [eduDegree, setEduDegree] = useState('')
  const [eduYear, setEduYear] = useState('')

  const [experience, setExperience] = useState([]) // { company, role, duration }
  const [expCompany, setExpCompany] = useState('')
  const [expRole, setExpRole] = useState('')
  const [expDuration, setExpDuration] = useState('')

  const [projects, setProjects] = useState([]) // { name, desc, link }
  const [projName, setProjName] = useState('')
  const [projDesc, setProjDesc] = useState('')
  const [projLink, setProjLink] = useState('')

  const [certifications, setCertifications] = useState([])
  const [newCert, setNewCert] = useState('')

  // File Upload states
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [resumePreview, setResumePreview] = useState('')
  const [resumeHistory, setResumeHistory] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const userString = localStorage.getItem('user')
      if (!userString) {
        navigate('/login')
        return
      }

      try {
        const user = JSON.parse(userString)
        if (!user.candidate_id) {
          setError('Recruiter and Admin roles do not have Candidate Profiles')
          setLoading(false)
          return
        }

        setCandidateId(user.candidate_id)
        const profile = await getCandidateById(user.candidate_id)
        
        setName(profile.name || '')
        setEmail(profile.email || '')
        setPhone(profile.phone_number || '')
        setPhoto(profile.profile_photo || '')
        setGithub(profile.github || '')
        setLinkedin(profile.linkedin || '')
        setPortfolio(profile.portfolio || '')
        setLocation(profile.location || '')
        setPreferredRoles(profile.preferred_roles || [])
        setPreferredLocations(profile.preferred_locations || [])
        setExpectedSalary(profile.expected_salary || '')
        setWorkPreference(profile.work_preference || 'Remote')
        setSkills(profile.skills || [])
        setEducation(profile.education || [])
        setExperience(profile.experience || [])
        setProjects(profile.projects || [])
        setCertifications(profile.certifications || [])
        
        if (profile.resume) {
          setResumePreview(profile.resume)
        }

        const history = await getResumeHistory(user.candidate_id)
        setResumeHistory(history)
      } catch (err) {
        setError('Failed to load profile details')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  // Array Add/Remove handlers
  const handleAddSkill = (e) => {
    e.preventDefault()
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (indexToRemove) => {
    setSkills(skills.filter((_, idx) => idx !== indexToRemove))
  }

  const handleAddEducation = (e) => {
    e.preventDefault()
    if (eduSchool.trim() && eduDegree.trim()) {
      setEducation([...education, { school: eduSchool.trim(), degree: eduDegree.trim(), year: eduYear.trim() }])
      setEduSchool('')
      setEduDegree('')
      setEduYear('')
    }
  }

  const handleRemoveEducation = (index) => {
    setEducation(education.filter((_, idx) => idx !== index))
  }

  const handleAddExperience = (e) => {
    e.preventDefault()
    if (expCompany.trim() && expRole.trim()) {
      setExperience([...experience, { company: expCompany.trim(), role: expRole.trim(), duration: expDuration.trim() }])
      setExpCompany('')
      setExpRole('')
      setExpDuration('')
    }
  }

  const handleRemoveExperience = (index) => {
    setExperience(experience.filter((_, idx) => idx !== index))
  }

  const handleAddProject = (e) => {
    e.preventDefault()
    if (projName.trim() && projDesc.trim()) {
      setProjects([...projects, { name: projName.trim(), desc: projDesc.trim(), link: projLink.trim() }])
      setProjName('')
      setProjDesc('')
      setProjLink('')
    }
  }

  const handleRemoveProject = (index) => {
    setProjects(projects.filter((_, idx) => idx !== index))
  }

  const handleAddCert = (e) => {
    e.preventDefault()
    if (newCert.trim() && !certifications.includes(newCert.trim())) {
      setCertifications([...certifications, newCert.trim()])
      setNewCert('')
    }
  }

  const handleRemoveCert = (index) => {
    setCertifications(certifications.filter((_, idx) => idx !== index))
  }

  // Preferred Roles handlers
  const handleAddPreferredRole = (e) => {
    e.preventDefault()
    if (newRole.trim() && !preferredRoles.includes(newRole.trim())) {
      setPreferredRoles([...preferredRoles, newRole.trim()])
      setNewRole('')
    }
  }

  const handleRemovePreferredRole = (index) => {
    setPreferredRoles(preferredRoles.filter((_, idx) => idx !== index))
  }

  // Preferred Locations handlers
  const handleAddPreferredLocation = (e) => {
    e.preventDefault()
    if (newPrefLocation.trim() && !preferredLocations.includes(newPrefLocation.trim())) {
      setPreferredLocations([...preferredLocations, newPrefLocation.trim()])
      setNewPrefLocation('')
    }
  }

  const handleRemovePreferredLocation = (index) => {
    setPreferredLocations(preferredLocations.filter((_, idx) => idx !== index))
  }

  // Resume File Upload handler
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setUploadSuccess(false)
      setUploadError('')
    }
  }

  const handleUploadResume = async () => {
    if (!selectedFile) return
    setUploadProgress(20)
    setUploadError('')
    try {
      setUploadProgress(50)
      const res = await uploadCandidateResume(candidateId, selectedFile)
      setUploadProgress(100)
      setUploadSuccess(true)
      setResumePreview(res.resume_preview || 'Resume uploaded successfully')
      setSelectedFile(null)
      const history = await getResumeHistory(candidateId)
      setResumeHistory(history)
    } catch (err) {
      setUploadError('Failed to upload resume file.')
      setUploadProgress(0)
    }
  }

  const handleDeleteResume = async () => {
    if (!window.confirm("Are you sure you want to delete your active resume? This will reset your evaluation metrics.")) return
    try {
      await deleteCandidateResume(candidateId)
      setResumePreview('')
      setUploadSuccess(false)
      const history = await getResumeHistory(candidateId)
      setResumeHistory(history)
    } catch (err) {
      console.error(err)
      alert("Failed to delete resume.")
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaveSuccess(false)

    const profileData = {
      name,
      phone_number: phone,
      profile_photo: photo,
      education,
      skills,
      experience,
      projects,
      certifications,
      github,
      linkedin,
      portfolio,
      location,
      preferred_roles: preferredRoles,
      preferred_locations: preferredLocations,
      expected_salary: expectedSalary,
      work_preference: workPreference
    }

    try {
      await updateCandidateProfile(candidateId, profileData)
      setSaveSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setError('Failed to update candidate profile details')
    } finally {
      setSaving(false)
    }
  }

  const getProfileCompletion = () => {
    let score = 0
    const recs = []

    if (resumePreview) {
      score += 20
    } else {
      recs.push({ text: 'Upload Resume', detail: 'Helps matching your profile with active job listings.' })
    }

    if (skills.length > 0) {
      score += 15
    } else {
      recs.push({ text: 'Add Skills', detail: 'Key skills are scanned by the ATS keywords engine.' })
    }

    if (education.length > 0) {
      score += 15
    } else {
      recs.push({ text: 'Complete Education', detail: 'Showcase your educational background.' })
    }

    if (experience.length > 0) {
      score += 15
    } else {
      recs.push({ text: 'Add Experience', detail: 'Provide details about your previous work roles.' })
    }

    if (phone.trim()) {
      score += 15
    } else {
      recs.push({ text: 'Add Phone Number', detail: 'Make sure recruiters can reach you easily.' })
    }

    if (preferredRoles.length > 0) {
      score += 10
    } else {
      recs.push({ text: 'Add Preferred Job Roles', detail: 'Ensures relevant recommended matches.' })
    }

    if (photo.trim()) {
      score += 10
    } else {
      recs.push({ text: 'Add Profile Photo', detail: 'Gives recruiters a friendly visual impression.' })
    }

    return { score, recs }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center font-sans">
        <p className="text-sm font-semibold text-slate-550">Loading profile data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      
      {/* Navbar Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xs font-bold text-slate-550 flex items-center gap-1 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-150 px-2 py-0.5 rounded font-mono uppercase tracking-wide">
              ID: {candidateId}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6 flex-grow w-full">
        
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-emerald-800 animate-scale-up">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>Candidate profile saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* Profile Completion Indicator */}
          {(() => {
            const { score, recs } = getProfileCompletion()
            return (
              <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold text-surface-900 tracking-tight flex items-center gap-2 font-display">
                      Profile Completion
                    </h2>
                    <p className="text-xs text-surface-450">
                      Complete your details to increase your suitability match for recruiters
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black font-display text-brand-600">{score}%</span>
                    <span className="text-xs text-slate-400 font-bold">complete</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-slate-50 border border-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
                    style={{ width: `${score}%` }}
                  />
                </div>

                {/* Recommendations */}
                {recs.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Recommendations to reach 100%</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {recs.map((rec) => (
                        <div key={rec.text} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between gap-1 hover:bg-slate-100/50 transition-colors">
                          <span className="text-xs font-bold text-slate-700">{rec.text}</span>
                          <span className="text-[10px] text-slate-450">{rec.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-xl p-4 flex items-center gap-2.5 text-xs font-semibold">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>Your profile is 100% complete! You are ready to apply for positions with maximum visibility.</span>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Card 1: Core details */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-6 shadow-sm">
            <h2 className="text-base font-extrabold text-surface-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3 font-display">
              <User className="w-5 h-5 text-brand-500" />
              General Profile Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Email (Account Credentials)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-surface-450 focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="San Francisco, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Profile Photo URL</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="https://example.com/avatar.jpg"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Portfolios Links */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-6 shadow-sm">
            <h2 className="text-base font-extrabold text-surface-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3 font-display">
              <Globe className="w-5 h-5 text-brand-500" />
              Social Profiles & Portfolios
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">GitHub Username</label>
                <div className="relative">
                  <Github className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="github_user"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">LinkedIn Profile URL</label>
                <div className="relative">
                  <Linkedin className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Portfolio Website</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="https://myportfolio.dev"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Skills Chip Bank */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-extrabold text-surface-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3 font-display">
              <Award className="w-5 h-5 text-brand-500" />
              Primary Professional Skills
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="E.g. React, Python, Docker..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-surface-800 flex-1 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-slate-200"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 text-xs font-semibold hover:bg-brand-100/50 transition-colors"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="text-brand-400 hover:text-brand-650 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <p className="text-xs text-slate-400">No skills added yet.</p>
              )}
            </div>
          </div>

          {/* Card 4: Dynamic lists (Edu, Exp, Proj, Certs) */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-6 shadow-sm">
            <h2 className="text-base font-extrabold text-surface-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3 font-display">
              <BookOpen className="w-5 h-5 text-brand-500" />
              Education & Academic Credentials
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-450 uppercase block">School/University</span>
                <input
                  type="text"
                  placeholder="Stanford University"
                  value={eduSchool}
                  onChange={(e) => setEduSchool(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-surface-850 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Degree & Major</span>
                <input
                  type="text"
                  placeholder="B.S. Computer Science"
                  value={eduDegree}
                  onChange={(e) => setEduDegree(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-surface-850 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 items-end w-full">
                <div className="space-y-1 flex-1">
                  <span className="text-[9px] font-bold text-slate-450 uppercase block">Graduation Year</span>
                  <input
                    type="text"
                    placeholder="2024"
                    value={eduYear}
                    onChange={(e) => setEduYear(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-surface-850 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-xl flex items-center justify-center transition-all h-9 w-9 flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {education.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50/50 border border-slate-150 p-4 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.degree}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.school} • {item.year}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(idx)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-xl border border-transparent hover:border-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Work Experience */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-6 shadow-sm">
            <h2 className="text-base font-extrabold text-surface-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3 font-display">
              <BriefcaseBusiness className="w-5 h-5 text-brand-500" />
              Work & Employment History
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Company Name</span>
                <input
                  type="text"
                  placeholder="Google LLC"
                  value={expCompany}
                  onChange={(e) => setExpCompany(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-surface-850 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Job Role</span>
                <input
                  type="text"
                  placeholder="Software Engineer Intern"
                  value={expRole}
                  onChange={(e) => setExpRole(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-surface-850 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 items-end w-full">
                <div className="space-y-1 flex-1">
                  <span className="text-[9px] font-bold text-slate-450 uppercase block">Duration</span>
                  <input
                    type="text"
                    placeholder="3 Months (Summer 2023)"
                    value={expDuration}
                    onChange={(e) => setExpDuration(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-surface-850 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-xl flex items-center justify-center transition-all h-9 w-9 flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {experience.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50/50 border border-slate-150 p-4 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.role}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.company} • {item.duration}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(idx)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-xl border border-transparent hover:border-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 6: Project list */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-6 shadow-sm">
            <h2 className="text-base font-extrabold text-surface-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3 font-display">
              <Globe className="w-5 h-5 text-brand-500" />
              Projects & Portfolio Work
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Project Title</span>
                <input
                  type="text"
                  placeholder="AI Task Scheduler"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-surface-850 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-450 uppercase block">GitHub/Demo Link</span>
                <input
                  type="text"
                  placeholder="https://github.com/user/project"
                  value={projLink}
                  onChange={(e) => setProjLink(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-surface-850 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 items-end w-full sm:col-span-3">
                <div className="space-y-1 flex-1">
                  <span className="text-[9px] font-bold text-slate-450 uppercase block">Short Description</span>
                  <input
                    type="text"
                    placeholder="Built a task orchestrator utilizing NLP and vector databases..."
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-surface-850 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-xl flex items-center justify-center transition-all h-9 w-9 flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {projects.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50/50 border border-slate-150 p-4 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    {item.link && (
                      <a href={item.link} className="text-[10px] text-brand-650 hover:underline mt-1 block font-mono" target="_blank" rel="noreferrer">
                        {item.link}
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(idx)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-xl border border-transparent hover:border-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 6.5: Certifications & Licenses */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-extrabold text-surface-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3 font-display">
              <Award className="w-5 h-5 text-brand-500" />
              Certifications & Professional Licenses
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="E.g. AWS Certified Solutions Architect, Cisco CCNA..."
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-surface-800 flex-1 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
              />
              <button
                type="button"
                onClick={handleAddCert}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-slate-200"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {certifications.map((cert, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold hover:bg-indigo-100/50 transition-colors animate-scale-up"
                >
                  {cert}
                  <button
                    type="button"
                    onClick={() => handleRemoveCert(index)}
                    className="text-indigo-400 hover:text-indigo-650 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {certifications.length === 0 && (
                <p className="text-xs text-slate-400">No certifications added yet.</p>
              )}
            </div>
          </div>

          {/* Card 7: Resume Upload Container */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-6 shadow-sm">
            <h2 className="text-base font-extrabold text-surface-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3 font-display">
              <FileText className="w-5 h-5 text-brand-500" />
              Resume File Management
            </h2>

            <div className="border border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-4">
              <Upload className="w-10 h-10 text-slate-400" />
              
              <div>
                <span className="text-xs text-slate-600 block">Drag & drop or browse resume file</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block mt-1">PDF, DOCX, TXT (MAX. 5MB)</span>
              </div>

              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="resume-file-input"
              />
              <div className="flex gap-2">
                <label
                  htmlFor="resume-file-input"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-250 cursor-pointer"
                >
                  Browse File
                </label>
                
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleUploadResume}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Upload {selectedFile.name}
                  </button>
                )}
              </div>

              {uploadProgress > 0 && (
                <div className="w-full max-w-xs bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-brand-600 h-full transition-all duration-300 animate-pulse" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              {uploadSuccess && (
                <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-4.5 h-4.5" /> File Uploaded Successfully!
                </p>
              )}

              {uploadError && (
                <p className="text-[11px] font-bold text-red-650">
                  {uploadError}
                </p>
              )}
            </div>

            {resumePreview && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Resume Context Preview</span>
                <p className="text-[11px] text-slate-650 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap font-mono">
                  {resumePreview}
                </p>
              </div>
            )}

            {/* Resume History List */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Resume Upload History</span>
                {resumePreview && (
                  <button
                    type="button"
                    onClick={handleDeleteResume}
                    className="text-red-500 hover:text-red-700 text-[10px] font-extrabold uppercase tracking-wide"
                  >
                    Delete Active Resume
                  </button>
                )}
              </div>

              {resumeHistory.length === 0 ? (
                <p className="text-xs text-slate-400">No upload history recorded yet.</p>
              ) : (
                <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/20 text-xs">
                  <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-150 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    <div className="col-span-5">Filename</div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-3">Upload Date</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {resumeHistory.map((item) => {
                      const sizeKb = (item.file_size / 1024).toFixed(1) + ' KB'
                      const dateStr = item.uploaded_at
                        ? new Date(item.uploaded_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Unknown'
                      const isActive = item.status === 'ACTIVE'
                      return (
                        <div key={item.id} className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-50/50 transition-colors">
                          <div className="col-span-5 font-semibold text-slate-700 truncate pr-2" title={item.filename}>
                            {item.filename}
                          </div>
                          <div className="col-span-2 text-slate-500">{sizeKb}</div>
                          <div className="col-span-3 text-slate-500">{dateStr}</div>
                          <div className="col-span-2 text-right">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                              isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-450'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 8: Job Preferences & Targets */}
          <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-6 shadow-sm">
            <h2 className="text-base font-extrabold text-surface-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3 font-display">
              <BriefcaseBusiness className="w-5 h-5 text-brand-500" />
              Career Preferences & Target Role Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Expected Annual Salary</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. ₹10 - ₹12 LPA"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Work Preference</label>
                <select
                  value={workPreference}
                  onChange={(e) => setWorkPreference(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-surface-850 focus:bg-white focus:outline-none focus:border-brand-500 transition-all font-semibold"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>
            </div>

            {/* Preferred Job Roles */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide block">Preferred Job Roles</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="E.g. Frontend Engineer, Product Manager..."
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-surface-800 flex-1 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddPreferredRole}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-slate-200"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {preferredRoles.map((role, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold animate-scale-up"
                  >
                    {role}
                    <button
                      type="button"
                      onClick={() => handleRemovePreferredRole(idx)}
                      className="text-purple-400 hover:text-purple-650 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                {preferredRoles.length === 0 && (
                  <p className="text-xs text-slate-400">No preferred roles specified.</p>
                )}
              </div>
            </div>

            {/* Preferred Locations */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide block">Preferred Work Locations</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="E.g. San Francisco, CA, remote, New York..."
                  value={newPrefLocation}
                  onChange={(e) => setNewPrefLocation(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-surface-800 flex-1 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddPreferredLocation}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-slate-200"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {preferredLocations.map((loc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold animate-scale-up"
                  >
                    {loc}
                    <button
                      type="button"
                      onClick={() => handleRemovePreferredLocation(idx)}
                      className="text-blue-400 hover:text-blue-650 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                {preferredLocations.length === 0 && (
                  <p className="text-xs text-slate-400">No preferred locations specified.</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-brand-600/10"
            >
              {saving ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default CandidateProfilePage
