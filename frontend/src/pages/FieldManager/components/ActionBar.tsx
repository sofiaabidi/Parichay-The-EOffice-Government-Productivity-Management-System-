import { useState } from 'react';
import { FolderPlus, FileText, Clipboard, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { AddProjectModal } from './modals/AddProjectModal';
import { AddSurveyModal } from './modals/AddSurveyModal';
import { AddProjectVisitModal } from './modals/AddProjectVisitModal';
import { AddSurveyVisitModal } from './modals/AddSurveyVisitModal';

export function ActionBar() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <Button
          onClick={() => setActiveModal('project')}
          variant="outline"
          className="h-14 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow justify-start px-4"
        >
          <FolderPlus className="w-5 h-5 text-blue-600 mr-3" />
          <span className="text-[#1F2937]">Add Project</span>
        </Button>

        <Button
          onClick={() => setActiveModal('survey')}
          variant="outline"
          className="h-14 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow justify-start px-4"
        >
          <FileText className="w-5 h-5 text-green-600 mr-3" />
          <span className="text-[#1F2937]">Add Survey</span>
        </Button>

        <Button
          onClick={() => setActiveModal('projectVisit')}
          variant="outline"
          className="h-14 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow justify-start px-4"
        >
          <Clipboard className="w-5 h-5 text-purple-600 mr-3" />
          <span className="text-[#1F2937]">Add Project Field Visit</span>
        </Button>

        <Button
          onClick={() => setActiveModal('surveyVisit')}
          variant="outline"
          className="h-14 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow justify-start px-4"
        >
          <MapPin className="w-5 h-5 text-orange-600 mr-3" />
          <span className="text-[#1F2937]">Add Survey Field Visit</span>
        </Button>
      </div>

      <AddProjectModal 
        open={activeModal === 'project'} 
        onClose={() => setActiveModal(null)} 
      />
      <AddSurveyModal 
        open={activeModal === 'survey'} 
        onClose={() => setActiveModal(null)} 
      />
      <AddProjectVisitModal 
        open={activeModal === 'projectVisit'} 
        onClose={() => setActiveModal(null)} 
      />
      <AddSurveyVisitModal 
        open={activeModal === 'surveyVisit'} 
        onClose={() => setActiveModal(null)} 
      />
    </>
  );
}
