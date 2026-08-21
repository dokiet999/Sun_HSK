import PageContainer from '../layouts/PageContainer'
import {
  HeroSection,
  FeaturesSection,
  LevelsSection,
  StudySection,
  CTASection,
} from '../features/home'

export default function Home() {
  return (
    <PageContainer>
      <HeroSection />
      <FeaturesSection />
      <LevelsSection />
      <StudySection />
      <CTASection />
    </PageContainer>
  )
}
