import Layout from "../components/Layout"
import ConversationList from "../components/ConversationList"
import ReadingPane from "../components/ReadingPane"
import { useStore } from "../store"

export default function InboxPage() {
  const selectedId = useStore((s) => s.ui.selectedId)

  return (
    <Layout>
      <div className="flex h-full overflow-hidden">
        <div
          className={`w-full md:w-[360px] lg:w-[400px] flex-shrink-0 h-full ${
            selectedId ? "hidden md:block" : ""
          }`}
        >
          <ConversationList />
        </div>
        <div
          className={`flex-1 min-w-0 h-full ${
            selectedId ? "flex" : "hidden md:flex"
          }`}
        >
          <ReadingPane />
        </div>
      </div>
    </Layout>
  )
}
