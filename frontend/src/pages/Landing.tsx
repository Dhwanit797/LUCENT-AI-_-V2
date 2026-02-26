import HeroSection from '../components/hero/HeroSection'
import LandingNav from '../components/navigation/LandingNav'
import LandingFeatures from '../components/storytelling/LandingFeatures'
import SectionCTA from '../components/storytelling/SectionCTA'
import SectionHowItWorks from '../components/storytelling/SectionHowItWorks'
import SectionProductPreview from '../components/storytelling/SectionProductPreview'
import SectionDivider from '../components/storytelling/SectionDivider'

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-ds-bg-base transition-colors duration-300">
      <div className="relative z-10">
        <LandingNav />
        <main>
          <HeroSection />
          <SectionDivider ticker />
          <LandingFeatures />
          <SectionDivider />
          <SectionProductPreview />
          <SectionDivider ticker />
          <SectionHowItWorks />
          <SectionDivider />
          <SectionCTA />
        </main>
      </div>
    </div>
  )
}
