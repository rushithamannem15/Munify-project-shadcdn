import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Building2, Users, TrendingUp, Shield } from "lucide-react"
import Copyright from "@/components/Copyright"
import MunifyLogo from "@/assets/MunifyLOGO.png"
import { apiService } from "@/services/api"

interface LandingPageStatistics {
  total_municipal_corporations: number
  total_projects_funded: number
  total_active_lenders: number
  total_approved_commitment: number
}

interface StatisticsResponse {
  status: string
  message: string
  data: LandingPageStatistics
}

export default function Landing() {
  const [statistics, setStatistics] = useState<LandingPageStatistics | null>(null)
  const [apiError, setApiError] = useState<boolean>(false)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await apiService.get<StatisticsResponse>("statistics/landing-page")
        if (response.status === "success" && response.data) {
          setStatistics(response.data)
          setApiError(false)
        } else {
          setApiError(true)
        }
      } catch (error) {
        console.error("Failed to fetch landing page statistics:", error)
        setApiError(true)
      }
    }

    fetchStatistics()
  }, [])

  // Format amount intelligently based on size (Crores, Lakhs, Thousands)
  const formatAmount = (amount: number): string => {
    if (amount >= 10000000) {
      // 1 crore = 10,000,000
      const crores = amount / 10000000
      return `₹${Math.round(crores)}Cr+`
    } else if (amount >= 100000) {
      // 1 lakh = 100,000
      const lakhs = amount / 100000
      return `₹${Math.round(lakhs)}L+`
    } else if (amount >= 1000) {
      // Thousands
      const thousands = amount / 1000
      return `₹${Math.round(thousands)}K+`
    } else {
      // Less than 1000
      return `₹${Math.round(amount)}+`
    }
  }

  // Show fallback message for entire page if API fails
  if (apiError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto py-20">
            <div className="text-6xl font-bold text-gray-300 mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Service Temporarily Unavailable
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              We're experiencing some technical difficulties. Our statistics service is currently unavailable.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Please try again later or contact support if the issue persists.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              {/* <Button variant="outline" asChild>
                <Link to="/login">Go to Login</Link>
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={MunifyLogo} className="h-12 w-auto" />
            
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            India's First Municipal Database
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Municipal Funding Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connecting municipal commissioners with funders to enable transparent 
            financing of municipal projects across India.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="px-8" asChild>
              <Link to="/main/projects/live">
                Explore Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8" asChild>
              <Link to="/main">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Real-time Project Tracking</CardTitle>
                <CardDescription>
                  Monitor live projects and funding progress with transparent updates
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Credit Grades & Analysis</CardTitle>
                <CardDescription>
                  Access comprehensive municipal credit scores and financial analysis
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Stakeholder Network</CardTitle>
                <CardDescription>
                  Connect with multilateral agencies, rating agencies, and regulators
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {statistics ? `${statistics.total_municipal_corporations}+` : "-"}
              </div>
              <div className="text-gray-600">Municipal Corporations</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {statistics ? formatAmount(statistics.total_projects_funded) : "-"}
              </div>
              <div className="text-gray-600">Projects Funded</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {statistics ? `${statistics.total_active_lenders}+` : "-"}
              </div>
              <div className="text-gray-600">Active Lenders</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {statistics ? formatAmount(statistics.total_approved_commitment) : "-"}
              </div>
              <div className="text-gray-600">Total Commitments</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join India's premier municipal funding platform today
          </p>
          <Button size="lg" variant="secondary" className="px-8" asChild>
            <Link to="/register">
              Register Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6" />
                <span className="text-xl font-bold">Munify</span>
              </div>
              <p className="text-gray-400">
                India's first national municipal database and funding platform.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Current Projects</li>
                <li>Funded Projects</li>
                <li>Municipal Details</li>
                <li>Credit Grades</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Liabrary</li>
                <li>Muncipal Analysis</li>
                <li>Muncipal Bonds</li>
                <li>Munify Ranking</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="text-white font-semibold">Address</li>
                <li>Munify Datatech Private Ltd</li>
                <li>85/89, Ground Floor, Jayshree Enclave Aspiran Garden,2nd street , KilpaukChennai - 600 010.</li>
               
                <li className="text-white font-semibold mt-4">Email</li>
                <li>contactus@munify.in</li>
                <li className="text-white font-semibold mt-4">Telephone</li>
                <li>99592 48111, 98412 85917</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8">
            <Copyright variant="dark" />
          </div>
        </div>
      </footer>
    </div>
  )
}
