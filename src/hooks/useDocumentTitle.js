import { useEffect } from 'react'

export function useDocumentTitle(title, description) {
  useEffect(() => {
    const prevTitle = document.title
    if (title) {
      document.title = `${title} | Gilded`
    }
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.setAttribute('name', 'description')
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute('content', description)
    }

    return () => {
      document.title = prevTitle
    }
  }, [title, description])
}

export default useDocumentTitle
