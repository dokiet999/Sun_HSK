import PromoBanner from '../components/ui/PromoBanner'
import Navbar from './Navbar'
import Footer from './Footer'

export default function PageContainer({ children }) {
  return (
    <>
      <PromoBanner />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
