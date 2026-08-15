import Layout from "../components/Layout"
import ConversationList from "../components/ConversationList"
import ReadingPane from "../components/ReadingPane"
import ComposeModal from "../components/ComposeModal"

export default function InboxPage() {
  return (
    <Layout>
      <div className="flex h-full overflow-hidden">
        <div className="w-full md:w-[360px] lg:w-[400px] flex-shrink-0 h-full">
          <ConversationList />
        </div>
        <div className="hidden md:flex flex-1 min-w-0 h-full">
          <ReadingPane />
        </div>
      </div>
      <ComposeModal />
    </Layout>
  )
}
