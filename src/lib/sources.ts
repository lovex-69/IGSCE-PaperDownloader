/**
 * Multi-Source Download System
 * 
 * Each source has its own URL builder and rules.
 * Sources are tried sequentially until one works.
 */

// Normalized download parameters (parsed once, used everywhere)
export interface NormalizedParams {
    subjectCode: string;
    session: 'm' | 's' | 'w';
    year: string;       // 2-digit: "23"
    yearFull: string;   // 4-digit: "2023"
    paper: string;      // "1", "2", etc
    variant: string;    // "1", "2", "" (empty for none)
    docType: 'qp' | 'ms' | 'er';
    subjectSlug?: string;
    subjectLevel?: string;
}

// Source definition
export interface PaperSource {
    name: string;
    /** Priority (lower = try first) */
    priority: number;
    /** Supported document types */
    supports: {
        qp: boolean;
        ms: boolean;
        er: boolean;
    };
    /** Build the PDF URL for this source */
    buildUrl: (params: NormalizedParams) => string;
}

// ============================================================================
// SOURCE DEFINITIONS
// ============================================================================

/**
 * BestExamHelp Mirror (Primary)
 * Pattern: /exam/{level}/{slug}/{yearFull}/{code}_{session}{year}_{type}_{paper}{variant}.pdf
 * Example: /exam/cambridge-igcse/mathematics-0444/2023/0444_s23_qp_22.pdf
 */
const BEST_EXAM_HELP: PaperSource = {
    name: 'BestExamHelp',
    priority: 1,
    supports: { qp: true, ms: true, er: true },
    buildUrl: (params) => {
        const baseUrl = 'https://bestexamhelp.com/exam';
        const level = params.subjectLevel === 'alevel' ? 'cambridge-international-as-a-level'
            : params.subjectLevel === 'olevel' ? 'cambridge-o-level'
                : 'cambridge-igcse';

        // Build filename based on doc type
        let filename: string;
        if (params.docType === 'er') {
            // ER has no paper/variant
            filename = `${params.subjectCode}_${params.session}${params.year}_er.pdf`;
        } else {
            // QP/MS: {code}_{session}{year}_{type}_{paper}{variant}.pdf
            filename = `${params.subjectCode}_${params.session}${params.year}_${params.docType}_${params.paper}${params.variant}.pdf`;
        }

        const slug = params.subjectSlug || `mathematics-${params.subjectCode}`;
        return `${baseUrl}/${level}/${slug}/${params.yearFull}/${filename}`;
    }
};

/**
 * PapaCambridge Mirror
 * Pattern varies - similar to CAIE official
 */
const PAPA_CAMBRIDGE: PaperSource = {
    name: 'PapaCambridge',
    priority: 2,
    supports: { qp: true, ms: true, er: true },
    buildUrl: (params) => {
        const baseUrl = 'https://pastpapers.papacambridge.com';
        const level = params.subjectLevel === 'alevel' ? 'Cambridge%20International%20AS%20and%20A%20Level'
            : params.subjectLevel === 'olevel' ? 'Cambridge%20O%20Level'
                : 'Cambridge%20IGCSE';

        let filename: string;
        if (params.docType === 'er') {
            filename = `${params.subjectCode}_${params.session}${params.year}_er.pdf`;
        } else {
            filename = `${params.subjectCode}_${params.session}${params.year}_${params.docType}_${params.paper}${params.variant}.pdf`;
        }

        return `${baseUrl}/${level}/${params.subjectCode}/${params.yearFull}/${filename}`;
    }
};

/**
 * GCE Guide Mirror
 * Another CAIE-style source
 */
const GCE_GUIDE: PaperSource = {
    name: 'GCEGuide',
    priority: 3,
    supports: { qp: true, ms: true, er: true },
    buildUrl: (params) => {
        const baseUrl = 'https://papers.gceguide.com';
        const level = params.subjectLevel === 'alevel' ? 'A%20Levels'
            : params.subjectLevel === 'olevel' ? 'O%20Levels'
                : 'IGCSE';

        let filename: string;
        if (params.docType === 'er') {
            filename = `${params.subjectCode}_${params.session}${params.year}_er.pdf`;
        } else {
            filename = `${params.subjectCode}_${params.session}${params.year}_${params.docType}_${params.paper}${params.variant}.pdf`;
        }

        return `${baseUrl}/${level}/${params.subjectCode}/${params.yearFull}/${filename}`;
    }
};

// ============================================================================
// SOURCE REGISTRY (Ordered by priority)
// ============================================================================

export const SOURCES: PaperSource[] = [
    BEST_EXAM_HELP,
    PAPA_CAMBRIDGE,
    GCE_GUIDE,
].sort((a, b) => a.priority - b.priority);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse paper code into paper number and variant
 * "22" → paper=2, variant=2
 * "2"  → paper=2, variant=""
 */
export const parsePaperCode = (paperCode: string): { paper: string; variant: string } => {
    const code = paperCode.trim();
    if (code.length >= 2) {
        return { paper: code.charAt(0), variant: code.charAt(1) };
    } else if (code.length === 1) {
        return { paper: code, variant: '' };
    }
    return { paper: '2', variant: '2' }; // Default
};

/**
 * Get 2-digit year from 4-digit
 */
export const twoDigitYear = (year: number): string => {
    return year.toString().slice(-2).padStart(2, '0');
};

/**
 * Create normalized params from user input
 */
export const normalizeParams = (
    subjectCode: string,
    subjectSlug: string,
    subjectLevel: string,
    paperCode: string,
    year: number,
    session: 'm' | 's' | 'w',
    docType: 'qp' | 'ms' | 'er'
): NormalizedParams => {
    const { paper, variant } = parsePaperCode(paperCode);
    const yy = twoDigitYear(year);

    return {
        subjectCode,
        session,
        year: yy,
        yearFull: year.toString(),
        paper,
        variant,
        docType,
        subjectSlug,
        subjectLevel,
    };
};

/**
 * Get session display name
 */
export const getSessionDisplayName = (session: 'm' | 's' | 'w'): string => {
    switch (session) {
        case 'm': return 'Feb/Mar';
        case 's': return 'May/June';
        case 'w': return 'Oct/Nov';
    }
};
