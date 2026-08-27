import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Badge, PageTitle } from '../components/Layout'
import { OwnerVerificationBadge } from '../components/VerificationBadge'
import { ownerVerificationLevel } from '../lib/verification'
import { useApp } from '../store/AppStore'

export const Verify = () => {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const user = state.users.find((item) => item.id === state.currentUserId)
  const [step, setStep] = useState(0)
  const [otp, setOtp] = useState('123456')
  if (!state.session?.loggedIn || !user) return <Navigate to="/login" replace />
  const verification = user.verification
  const steps = [
    {
      title: 'College ID card',
      copy: 'Upload and confirm your college ID card. This is simulated for the demo.',
      done: verification.identityVerified,
      action: () => dispatch({ type: 'completeVerificationStep', userId: user.id, step: 'identity' }),
    },
    {
      title: 'Campus enrolment',
      copy: `Confirm ${user.department}, ${user.year} enrolment.`,
      done: verification.campusVerified,
      action: () => dispatch({ type: 'completeVerificationStep', userId: user.id, step: 'campus' }),
    },
    {
      title: 'Contact verification',
      copy: 'Enter the six-digit demo OTP shown below.',
      done: verification.contactVerified,
      action: () => {
        if (/^\d{6}$/.test(otp)) dispatch({ type: 'completeVerificationStep', userId: user.id, step: 'contact' })
      },
    },
  ]
  const currentStep = steps[step] ?? steps[2]
  const complete = ownerVerificationLevel(verification) === 'Fully Verified'
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="Member verification" title="Complete your campus check" />
      <div className="rounded-3xl bg-slate-900 p-6 text-white">
        <p className="text-sm font-black">{user.name}</p>
        <p className="mt-1 text-xs text-slate-300">{user.department} · {user.year}</p>
        <div className="mt-4"><OwnerVerificationBadge user={user} /></div>
      </div>
      {complete ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <Badge tone="green">Fully verified</Badge>
          <h2 className="mt-3 text-2xl font-black text-emerald-900">Welcome to Campus Circular</h2>
          <p className="mt-2 text-sm text-emerald-800">Your identity, enrolment, and contact are verified.</p>
          <button onClick={() => navigate('/')} className="mt-5 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white">
            Continue to Campus Circular
          </button>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-6 grid grid-cols-3 gap-2">
            {steps.map((item, index) => (
              <button key={item.title} onClick={() => setStep(index)} className={`rounded-xl p-3 text-left text-xs font-bold ${item.done ? 'bg-emerald-50 text-emerald-700' : index === step ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'}`}>
                {index + 1}. {item.title}
              </button>
            ))}
          </div>
          <h2 className="text-xl font-black">{currentStep.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{currentStep.copy}</p>
          {step === 0 && <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">College_ID_card.pdf · ready to confirm</div>}
          {step === 2 && (
            <label className="mt-5 block text-xs font-bold text-slate-600">Demo OTP: <strong className="text-emerald-700">123456</strong>
              <input value={otp} onChange={(event) => setOtp(event.target.value)} maxLength={6} className="field" />
            </label>
          )}
          <button onClick={() => { currentStep.action(); if (step < 2) setStep(step + 1) }} className="mt-5 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white">
            {currentStep.done ? 'Confirmed' : 'Confirm and continue'}
          </button>
        </div>
      )}
    </div>
  )
}
