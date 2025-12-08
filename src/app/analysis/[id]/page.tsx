'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/use-auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'

export default function AnalysisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [analysis, setAnalysis] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    fetchAnalysis()
  }, [user, params.id, router])

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/user/history/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSteps(newExpanded)
  }

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading analysis...</p>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Analysis Details</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button onClick={() => router.push('/')}>
              New Analysis
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-3">
              {/* Platform badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800">
                {analysis.platform === 'polymarket' ? (
                  <img
                    src="https://www.google.com/s2/favicons?domain=polymarket.com&sz=32"
                    alt="Polymarket"
                    className="w-6 h-6"
                  />
                ) : analysis.platform === 'kalshi' ? (
                  <img
                    src="https://kalshi.com/logo192.png"
                    alt="Kalshi"
                    className="w-6 h-6 rounded-sm"
                  />
                ) : (
                  <span className="text-gray-500 text-sm font-bold">?</span>
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">
                  {analysis.market_question
                    || analysis.forecast_card?.question
                    || analysis.forecast_card?.market?.question
                    || 'Market Analysis'}
                </CardTitle>
                <CardDescription>
                  <div className="flex flex-col gap-2 mt-2">
                    {analysis.market_url && (
                      <a
                        href={analysis.market_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline truncate"
                      >
                        {analysis.market_url}
                      </a>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {analysis.started_at && (
                        <span>Started: {format(new Date(analysis.started_at), 'PPpp')}</span>
                      )}
                      {analysis.completed_at && (
                        <span>Completed: {format(new Date(analysis.completed_at), 'PPpp')}</span>
                      )}
                      {analysis.duration_seconds && (
                        <span>Duration: {Math.floor(analysis.duration_seconds / 60)}m {analysis.duration_seconds % 60}s</span>
                      )}
                    </div>
                  </div>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Probability - check multiple sources including nested forecast_card.response */}
                {(analysis.p_neutral !== undefined
                  || analysis.forecast_card?.pNeutral !== undefined
                  || analysis.forecast_card?.response?.finalProbabilities?.pNeutral !== undefined) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Probability</p>
                    <p className="text-2xl font-bold">
                      {((analysis.p_neutral
                        || analysis.forecast_card?.pNeutral
                        || analysis.forecast_card?.response?.finalProbabilities?.pNeutral
                        || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
                {/* Market P0 */}
                {(analysis.p0 !== undefined
                  || analysis.forecast_card?.response?.finalProbabilities?.p0 !== undefined) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Market Price (P0)</p>
                    <p className="text-2xl font-bold">
                      {((analysis.p0 || analysis.forecast_card?.response?.finalProbabilities?.p0 || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
                {/* Valyu Cost */}
                {analysis.valyu_cost !== undefined && analysis.valyu_cost > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">API Cost</p>
                    <p className="text-lg font-semibold">
                      ${analysis.valyu_cost.toFixed(4)}
                    </p>
                  </div>
                )}
                {/* Platform */}
                {analysis.platform && (
                  <div>
                    <p className="text-sm text-muted-foreground">Platform</p>
                    <Badge variant="secondary" className="mt-1 capitalize">
                      {analysis.platform}
                    </Badge>
                  </div>
                )}
                {/* Status */}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={analysis.status === 'completed' ? 'default' : 'destructive'} className="mt-1">
                    {analysis.status}
                  </Badge>
                </div>
              </div>

              {/* Drivers - check multiple locations */}
              {(() => {
                const drivers = analysis.drivers
                  || analysis.forecast_card?.drivers
                  || analysis.forecast_card?.response?.drivers;
                return drivers && Array.isArray(drivers) && drivers.length > 0 ? (
                  <div>
                    <h3 className="font-semibold mb-2">Key Drivers</h3>
                    <div className="flex flex-wrap gap-2">
                      {drivers.map((driver: string, i: number) => (
                        <Badge key={i} variant="outline">{driver}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Markdown Report - check multiple possible locations */}
              {(analysis.markdown_report
                || analysis.forecast_card?.markdownReport
                || analysis.forecast_card?.response?.markdownReport) && (
                <div>
                  <h3 className="font-semibold mb-2">Analysis Report</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-4 rounded-lg max-h-[600px] overflow-y-auto">
                    <ReactMarkdown>
                      {analysis.markdown_report
                        || analysis.forecast_card?.markdownReport
                        || analysis.forecast_card?.response?.markdownReport}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {analysis.error_message && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-red-700 dark:text-red-400">Error</h3>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {analysis.error_message}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {analysis.analysis_steps && analysis.analysis_steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis Steps</CardTitle>
              <CardDescription>
                Detailed breakdown of the analysis process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.analysis_steps.map((step: any, index: number) => (
                <Collapsible
                  key={index}
                  open={expandedSteps.has(index)}
                  onOpenChange={() => toggleStep(index)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{step.step}</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedSteps.has(index) ? 'rotate-180' : ''
                      }`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-3 pb-3">
                    <div className="mt-2 p-4 bg-muted/30 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(step.details, null, 2)}
                      </pre>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(step.timestamp), 'PPpp')}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}