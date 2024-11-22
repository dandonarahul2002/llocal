import React, { ChangeEvent, ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { PiPaperPlaneRightFill, PiStopCircleBold } from 'react-icons/pi'
import { SubmitHandler, useForm } from 'react-hook-form'
import { usePrompt } from '@renderer/hooks/usePrompt'
import { TextArea } from '@renderer/ui/TextArea'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@renderer/ui/Button'
import { MoreButton } from './MoreButton'
import { ContextCard } from './ContextCard'
import { AutoComplete } from './AutoComplete'
import { useAtom, useSetAtom } from 'jotai'
import { knowledgeBaseAtom, stopGeneratingAtom } from '@renderer/store/mocks'

// Ensuring there is atleast one valid character, and no whitespaces this helps eradicate the white space as a message edge case
const FormFieldsSchema = z.object({
  prompt: z.string().trim().min(1)
})

// defining the form type as usual
type FormFieldsType = {
  prompt?: string
}

export const InputForm = ({ className, ...props }: ComponentProps<'form'>): React.ReactElement => {
  const { register, handleSubmit, reset } = useForm<FormFieldsType>({
    resolver: zodResolver(FormFieldsSchema)
  })
  const [isLoading, promptReq] = usePrompt()
  const [autoCompleteList, setAutoCompleteList] = useAtom(knowledgeBaseAtom);
  const setStopGenerating = useSetAtom(stopGeneratingAtom)

  function handleClick(): void {
    setStopGenerating(pre => !pre)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      handleSubmit(onSubmit)()
    }
  }

  const onSubmit: SubmitHandler<FormFieldsType> = async (data) => {
    reset()
    setAutoCompleteList([])
    await promptReq(data.prompt || '')
  }

  async function handleChange(e: ChangeEvent<HTMLTextAreaElement>): Promise<void> {
    const input = e.target.value;
    if (input.trim().startsWith("/")) {
      const list = await window.api.getVectorDbList();
      const typed = input.replace('/', ''); // this is to get whatever the user has typed after the /
      setAutoCompleteList(list.filter((val) => val.fileName.includes(typed)))
    } else {
      setAutoCompleteList([]) // set it empty when it does not start with /
    }
  }

  return (
    <div className='relative w-3/6 h-fit flex flex-col'>
      {(autoCompleteList.length > 0) && <AutoComplete className='absolute -bottom-3 transform -translate-y-1/2' list={autoCompleteList} reset={reset} />}
      <ContextCard className='self-end m-1 mr-5' />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={twMerge(`relative  h-12`, className)}
        {...props}
      >
        <TextArea
          name="prompt"
          register={register}
          disabled={isLoading}
          onKeyDown={handleKeyDown}
          handleChange={handleChange}
          className={`h-full w-full pl-10 pr-8`}
          placeholder="Enter your prompt"
        />
        <MoreButton className="text-2xl absolute left-2 top-1/2 transform -translate-y-1/2" />

        {isLoading ? <Button
          type="reset"
          variant={'icon'}
          onClick={handleClick}
          className="text-2xl absolute right-2 top-1/2 transform -translate-y-1/2"
        >
          <PiStopCircleBold />
        </Button>
          :
          <Button
            type="submit"
            variant={'icon'}
            disabled={isLoading}
            className="text-2xl absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <PiPaperPlaneRightFill />
          </Button>}
      </form>
    </div>
  )
}
