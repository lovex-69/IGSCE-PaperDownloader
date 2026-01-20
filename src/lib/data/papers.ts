// IGCSE on Fingertips - Mock Papers Data

export interface Question {
    number: number;
    text: string;
    topic: string;
    answerPosition?: number;
}

export interface Paper {
    id: string;
    examId: string;
    examName: string;
    year: number;
    subject: string;
    title: string;
    variant?: string;
    session?: string;
    hasAnswerSheet: boolean;
    answerSheetType?: 'official' | 'marking-scheme';
    questionCount: number;
    topics: string[];
    pdfUrl: string;
    answerPdfUrl?: string;
    downloadCount: number;
    questions: Question[];
}

export const papers: Paper[] = [
    // IGCSE Mathematics Papers
    {
        id: 'igcse-2024-maths-0580-may',
        examId: 'igcse',
        examName: 'IGCSE',
        year: 2024,
        subject: 'Mathematics',
        title: 'IGCSE Mathematics 0580 May/June 2024',
        variant: 'Paper 2',
        session: 'May/June',
        hasAnswerSheet: true,
        answerSheetType: 'marking-scheme',
        questionCount: 22,
        topics: ['Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Number'],
        pdfUrl: '/papers/igcse-maths-0580-2024-may.pdf',
        answerPdfUrl: '/answers/igcse-maths-0580-2024-may-ms.pdf',
        downloadCount: 12500,
        questions: [
            { number: 1, text: 'Calculate the value of 3.7² - 1.3²', topic: 'Number', answerPosition: 1 },
            { number: 2, text: 'Solve the equation 5x - 3 = 2x + 12', topic: 'Algebra', answerPosition: 1 },
            { number: 3, text: 'Find the area of a triangle with base 8cm and height 5cm', topic: 'Geometry', answerPosition: 1 },
        ],
    },
    {
        id: 'igcse-2024-maths-0580-oct',
        examId: 'igcse',
        examName: 'IGCSE',
        year: 2024,
        subject: 'Mathematics',
        title: 'IGCSE Mathematics 0580 Oct/Nov 2024',
        variant: 'Paper 2',
        session: 'Oct/Nov',
        hasAnswerSheet: true,
        answerSheetType: 'marking-scheme',
        questionCount: 22,
        topics: ['Algebra', 'Geometry', 'Probability', 'Functions'],
        pdfUrl: '/papers/igcse-maths-0580-2024-oct.pdf',
        answerPdfUrl: '/answers/igcse-maths-0580-2024-oct-ms.pdf',
        downloadCount: 9800,
        questions: [
            { number: 1, text: 'Simplify 3a + 2b - a + 5b', topic: 'Algebra', answerPosition: 1 },
        ],
    },
    // IGCSE Physics Papers
    {
        id: 'igcse-2024-physics-0625-may',
        examId: 'igcse',
        examName: 'IGCSE',
        year: 2024,
        subject: 'Physics',
        title: 'IGCSE Physics 0625 May/June 2024',
        variant: 'Paper 2',
        session: 'May/June',
        hasAnswerSheet: true,
        answerSheetType: 'marking-scheme',
        questionCount: 40,
        topics: ['Mechanics', 'Thermal Physics', 'Waves', 'Electricity', 'Magnetism'],
        pdfUrl: '/papers/igcse-physics-0625-2024-may.pdf',
        answerPdfUrl: '/answers/igcse-physics-0625-2024-may-ms.pdf',
        downloadCount: 11200,
        questions: [
            { number: 1, text: 'A car travels 150km in 2 hours. Calculate its average speed.', topic: 'Mechanics', answerPosition: 1 },
        ],
    },
    // IGCSE Chemistry Papers
    {
        id: 'igcse-2024-chemistry-0620-may',
        examId: 'igcse',
        examName: 'IGCSE',
        year: 2024,
        subject: 'Chemistry',
        title: 'IGCSE Chemistry 0620 May/June 2024',
        variant: 'Paper 2',
        session: 'May/June',
        hasAnswerSheet: true,
        answerSheetType: 'marking-scheme',
        questionCount: 40,
        topics: ['Atomic Structure', 'Bonding', 'Stoichiometry', 'Organic Chemistry'],
        pdfUrl: '/papers/igcse-chemistry-0620-2024-may.pdf',
        answerPdfUrl: '/answers/igcse-chemistry-0620-2024-may-ms.pdf',
        downloadCount: 10500,
        questions: [
            { number: 1, text: 'What is the atomic number of Carbon?', topic: 'Atomic Structure', answerPosition: 1 },
        ],
    },
    // A-Level Papers
    {
        id: 'alevel-2024-maths-9709-may',
        examId: 'a-levels',
        examName: 'A-Level',
        year: 2024,
        subject: 'Mathematics',
        title: 'A-Level Mathematics 9709 May/June 2024',
        variant: 'Paper 1 Pure Mathematics',
        session: 'May/June',
        hasAnswerSheet: true,
        answerSheetType: 'marking-scheme',
        questionCount: 12,
        topics: ['Calculus', 'Vectors', 'Series', 'Trigonometry'],
        pdfUrl: '/papers/alevel-maths-9709-2024-may.pdf',
        answerPdfUrl: '/answers/alevel-maths-9709-2024-may-ms.pdf',
        downloadCount: 8900,
        questions: [
            { number: 1, text: 'Find dy/dx when y = 3x² - 4x + 7', topic: 'Calculus', answerPosition: 1 },
        ],
    },
    {
        id: 'alevel-2024-physics-9702-may',
        examId: 'a-levels',
        examName: 'A-Level',
        year: 2024,
        subject: 'Physics',
        title: 'A-Level Physics 9702 May/June 2024',
        variant: 'Paper 1',
        session: 'May/June',
        hasAnswerSheet: true,
        answerSheetType: 'marking-scheme',
        questionCount: 40,
        topics: ['Mechanics', 'Waves', 'Electricity', 'Nuclear Physics'],
        pdfUrl: '/papers/alevel-physics-9702-2024-may.pdf',
        answerPdfUrl: '/answers/alevel-physics-9702-2024-may-ms.pdf',
        downloadCount: 7600,
        questions: [
            { number: 1, text: 'Define acceleration and state its SI unit.', topic: 'Mechanics', answerPosition: 1 },
        ],
    },
    // SAT Papers
    {
        id: 'sat-2024-practice1',
        examId: 'sat',
        examName: 'SAT',
        year: 2024,
        subject: 'Mathematics',
        title: 'SAT Practice Test 1 - Math Section',
        hasAnswerSheet: true,
        answerSheetType: 'official',
        questionCount: 44,
        topics: ['Algebra', 'Problem Solving', 'Advanced Math', 'Geometry'],
        pdfUrl: '/papers/sat-2024-practice1-math.pdf',
        answerPdfUrl: '/answers/sat-2024-practice1-math-ans.pdf',
        downloadCount: 15200,
        questions: [
            { number: 1, text: 'If 3x + 5 = 17, what is the value of x?', topic: 'Algebra', answerPosition: 1 },
        ],
    },
    // IB Papers
    {
        id: 'ib-2024-maths-hl',
        examId: 'ib',
        examName: 'IB Diploma',
        year: 2024,
        subject: 'Mathematics',
        title: 'IB Mathematics HL May 2024',
        variant: 'Paper 1',
        session: 'May',
        hasAnswerSheet: true,
        answerSheetType: 'marking-scheme',
        questionCount: 10,
        topics: ['Calculus', 'Statistics', 'Vectors', 'Complex Numbers'],
        pdfUrl: '/papers/ib-maths-hl-2024-may.pdf',
        answerPdfUrl: '/answers/ib-maths-hl-2024-may-ms.pdf',
        downloadCount: 6500,
        questions: [
            { number: 1, text: 'Find the integral of sin(2x)dx', topic: 'Calculus', answerPosition: 1 },
        ],
    },
    // Papers without answers
    {
        id: 'igcse-2023-biology-0610',
        examId: 'igcse',
        examName: 'IGCSE',
        year: 2023,
        subject: 'Biology',
        title: 'IGCSE Biology 0610 May/June 2023',
        variant: 'Paper 2',
        session: 'May/June',
        hasAnswerSheet: false,
        questionCount: 40,
        topics: ['Cells', 'Human Biology', 'Plant Biology', 'Ecology'],
        pdfUrl: '/papers/igcse-biology-0610-2023.pdf',
        downloadCount: 5400,
        questions: [
            { number: 1, text: 'Name the organelle responsible for photosynthesis.', topic: 'Cells' },
        ],
    },
    {
        id: 'igcse-2024-economics-0455',
        examId: 'igcse',
        examName: 'IGCSE',
        year: 2024,
        subject: 'Economics',
        title: 'IGCSE Economics 0455 May/June 2024',
        variant: 'Paper 1',
        session: 'May/June',
        hasAnswerSheet: true,
        answerSheetType: 'marking-scheme',
        questionCount: 30,
        topics: ['Microeconomics', 'Macroeconomics', 'International Trade'],
        pdfUrl: '/papers/igcse-economics-0455-2024.pdf',
        answerPdfUrl: '/answers/igcse-economics-0455-2024-ms.pdf',
        downloadCount: 7800,
        questions: [
            { number: 1, text: 'Define the term opportunity cost.', topic: 'Microeconomics', answerPosition: 1 },
        ],
    },
];

// Helper functions
export const getPaperById = (id: string): Paper | undefined => {
    return papers.find(paper => paper.id === id);
};

export const getPapersByExam = (examId: string): Paper[] => {
    return papers.filter(paper => paper.examId === examId);
};

export const getPapersByYear = (year: number): Paper[] => {
    return papers.filter(paper => paper.year === year);
};

export const getPapersBySubject = (subject: string): Paper[] => {
    return papers.filter(paper =>
        paper.subject.toLowerCase().includes(subject.toLowerCase())
    );
};

export const searchPapers = (query: string): Paper[] => {
    const lowerQuery = query.toLowerCase();
    return papers.filter(paper =>
        paper.title.toLowerCase().includes(lowerQuery) ||
        paper.subject.toLowerCase().includes(lowerQuery) ||
        paper.examName.toLowerCase().includes(lowerQuery) ||
        paper.topics.some(t => t.toLowerCase().includes(lowerQuery)) ||
        paper.questions.some(q => q.text.toLowerCase().includes(lowerQuery))
    );
};

export const getFeaturedPapers = (): Paper[] => {
    return [...papers]
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 8);
};

export const getRecentPapers = (): Paper[] => {
    return [...papers]
        .sort((a, b) => b.year - a.year)
        .slice(0, 10);
};
