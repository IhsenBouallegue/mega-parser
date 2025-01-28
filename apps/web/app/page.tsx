"use client";

import AnalysisDialog from "@/components/AnalysisDialog";
import Header from "@/components/Header";
import MainContent from "@/components/MainContent";
import Sidebar from "@/components/Sidebar";
import StatisticsDialog from "@/components/StatisticsDialog";
import StatusBar from "@/components/StatusBar";
import UploadDialog from "@/components/UploadDialog";
import { Button } from "@/components/ui/button";
import { AnalysisCard, BackgroundGradient, GlassmorphicContainer } from "@/components/ui/styled";
import { useStore } from "@/store/useStore";
import { BarChart2, Play, Upload } from "lucide-react";
import type { FileObject } from "mega-parser";
import { useState } from "react";

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isStatisticsDialogOpen, setIsStatisticsDialogOpen] = useState(false);
  const { projects, currentProjectId, setAnalysisResults, addProject, setCurrentProject, isBackgroundEnabled } =
    useStore();

  const handleAnalysisComplete = (results: FileObject[]) => {
    const newProjectId = addProject("New Analysis");
    setAnalysisResults(results);
    setCurrentProject(newProjectId);
    setIsAnalysisDialogOpen(false);
  };

  const handleNewAnalysis = () => {
    setIsAnalysisDialogOpen(true);
  };

  const handleUploadAnalysis = () => {
    setIsUploadDialogOpen(true);
  };

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const hasAnalysisResults = currentProject && currentProject.analysisResults.length > 0;

  return (
    <>
      <BackgroundGradient enabled={isBackgroundEnabled} />
      <div className="flex flex-col h-screen bg-transparent">
        <div className="m-4">
          <GlassmorphicContainer>
            <Header />
          </GlassmorphicContainer>
        </div>
        <div className="flex-1 overflow-visible mx-4 mb-4">
          {!hasAnalysisResults ? (
            <GlassmorphicContainer className="flex-1 flex flex-col items-center p-8 pt-32 h-full">
              <div className="flex items-center gap-8">
                <AnalysisCard
                  icon={Play}
                  title="New Analysis"
                  description="Start a new project analysis"
                  onClick={handleNewAnalysis}
                />
                <div className="text-2xl font-semibold text-muted-foreground">or</div>
                <AnalysisCard
                  icon={Upload}
                  title="Upload Analysis"
                  description="Import an existing analysis file"
                  onClick={handleUploadAnalysis}
                />
              </div>
            </GlassmorphicContainer>
          ) : (
            <div className="flex gap-4 flex-1 h-full">
              <GlassmorphicContainer className="h-full w-1/4">
                <Sidebar collapsed={sidebarCollapsed} />
              </GlassmorphicContainer>
              <div className="h-full overflow-visible w-3/4">
                <MainContent />
              </div>
            </div>
          )}
        </div>
        <div className="mx-4 mb-4">
          <GlassmorphicContainer>
            <StatusBar />
          </GlassmorphicContainer>
        </div>
        <AnalysisDialog
          open={isAnalysisDialogOpen}
          onOpenChange={setIsAnalysisDialogOpen}
          onAnalysisComplete={handleAnalysisComplete}
        />
        <UploadDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} />
        <StatisticsDialog open={isStatisticsDialogOpen} onOpenChange={setIsStatisticsDialogOpen} />
      </div>
      {hasAnalysisResults && (
        <Button
          onClick={() => setIsStatisticsDialogOpen(true)}
          className="fixed bottom-24 right-8 p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <BarChart2 className="h-6 w-6" />
        </Button>
      )}
    </>
  );
}
