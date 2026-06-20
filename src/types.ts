export interface Question {
  id: string;
  text: string;
  category: string;
  tips: string;
  idealAnswer: string;
}

export interface CandidateResponse {
  questionId: string;
  questionText: string;
  category: string;
  score: number; // 1 to 5
  responseText?: string;
}

export interface ActiveSession {
  candidateName: string;
  answers: CandidateResponse[];
  currentQuestionIndex: number;
  totalQuestions: number;
}
