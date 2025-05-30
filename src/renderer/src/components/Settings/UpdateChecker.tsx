import React, { ComponentProps, useState, useEffect } from 'react'
import { Button } from '@renderer/ui/Button'
import { twMerge } from 'tailwind-merge'
import { toast } from 'sonner'
import { HiOutlineArrowPath } from 'react-icons/hi2'

export const UpdateChecker = ({ className, ...props }: ComponentProps<'div'>): React.ReactElement => {
  const [isChecking, setIsChecking] = useState(false)
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    // Check if we're in development mode
    setIsDev(process.env.NODE_ENV === 'development')
  }, [])

  const handleCheckForUpdates = async (): Promise<void> => {
    if (isDev) {
      toast.info('Update checking is disabled in development mode')
      return
    }

    setIsChecking(true)
    try {
      const updateAvailable = await window.api.checkForUpdates()
      if (updateAvailable) {
        toast.success('Update check initiated. If an update is available, you will see a notification.')
      } else {
        toast.info('You are running the latest version of LLocal!')
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
      toast.error('Failed to check for updates. Please try again later.')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className={twMerge('flex flex-col gap-2 justify-center', className)} {...props}>
      <h1 className="font-thin">App Updates:</h1>
      <div className="flex items-center gap-3">
        <Button
          onClick={handleCheckForUpdates}
          disabled={isChecking || isDev}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <HiOutlineArrowPath className={`text-lg ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Check for Updates'}
        </Button>
        <span className="text-sm text-gray-500">
          {isDev ? 'Updates disabled in development' : 'Auto-updates are enabled for this application'}
        </span>
      </div>
    </div>
  )
}
