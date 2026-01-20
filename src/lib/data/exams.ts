// IGCSE on Fingertips - Mock Exam Categories Data

export interface Exam {
    id: string;
    name: string;
    shortName: string;
    description: string;
    icon: string;
    color: string;
    paperCount: number;
    subjects: string[];
    years: number[];
}

export const exams: Exam[] = [
    {
        id: 'igcse',
        name: 'IGCSE',
        shortName: 'IGCSE',
        description: 'International General Certificate of Secondary Education',
        icon: '📚',
        color: '#3b82f6',
        paperCount: 350,
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Business Studies', 'Computer Science', 'Psychology', 'History', 'English'],
        years: [2024, 2023, 2022, 2021, 2020, 2019],
    },
    {
        id: 'a-levels',
        name: 'AS & A-Levels',
        shortName: 'A-Levels',
        description: 'Advanced Level Qualifications',
        icon: '🎓',
        color: '#8b5cf6',
        paperCount: 280,
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Business', 'Psychology', 'Computer Science'],
        years: [2024, 2023, 2022, 2021, 2020, 2019],
    },
    {
        id: 'o-levels',
        name: 'O-Levels',
        shortName: 'O-Levels',
        description: 'Ordinary Level Qualifications',
        icon: '📖',
        color: '#10b981',
        paperCount: 200,
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Economics'],
        years: [2024, 2023, 2022, 2021, 2020, 2019],
    },
    {
        id: 'ib',
        name: 'IB Diploma',
        shortName: 'IB',
        description: 'International Baccalaureate Programme',
        icon: '🌍',
        color: '#f59e0b',
        paperCount: 150,
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Business Management'],
        years: [2024, 2023, 2022, 2021, 2020],
    },
    {
        id: 'sat',
        name: 'SAT',
        shortName: 'SAT',
        description: 'Scholastic Assessment Test',
        icon: '✏️',
        color: '#ec4899',
        paperCount: 100,
        subjects: ['Reading & Writing', 'Mathematics'],
        years: [2024, 2023, 2022, 2021, 2020],
    },
    {
        id: 'ap',
        name: 'AP Exams',
        shortName: 'AP',
        description: 'Advanced Placement Examinations',
        icon: '🏆',
        color: '#06b6d4',
        paperCount: 120,
        subjects: ['Calculus', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Computer Science'],
        years: [2024, 2023, 2022, 2021, 2020],
    },
];

export const getExamById = (id: string): Exam | undefined => {
    return exams.find(exam => exam.id === id);
};

export const getExamsBySubject = (subject: string): Exam[] => {
    return exams.filter(exam =>
        exam.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()))
    );
};
