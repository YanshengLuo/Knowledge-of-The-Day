export type TopicKey =
  | 'ai'
  | 'biotech'
  | 'computational biology'
  | 'oncology'
  | 'single-cell'
  | 'spatial'
  | 'gene therapy'
  | 'funding'
  | 'hiring'
  | 'translational medicine'
  | 'immunology';

export type TopicRule = {
  id: TopicKey;
  label: string;
  keywords: string[];
};

export const TOPICS: TopicRule[] = [
  {
    id: 'ai',
    label: 'AI',
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'foundation model', 'large language model', 'llm']
  },
  {
    id: 'biotech',
    label: 'Biotech',
    keywords: ['biotech', 'biopharma', 'life sciences', 'drug discovery', 'therapeutics', 'clinical trial']
  },
  {
    id: 'computational biology',
    label: 'Computational Biology',
    keywords: ['computational biology', 'bioinformatics', 'systems biology', 'multi-omics', 'omics', 'modeling']
  },
  {
    id: 'oncology',
    label: 'Oncology',
    keywords: ['oncology', 'cancer', 'tumor', 'tumour', 'neoplasm', 'metastasis', 'checkpoint']
  },
  {
    id: 'single-cell',
    label: 'Single-cell',
    keywords: ['single-cell', 'single cell', 'scrna-seq', 'single-nucleus', 'single nucleus']
  },
  {
    id: 'spatial',
    label: 'Spatial',
    keywords: ['spatial transcriptomics', 'spatial biology', 'spatial omics', 'multiplex imaging']
  },
  {
    id: 'gene therapy',
    label: 'Gene Therapy',
    keywords: ['gene therapy', 'cell therapy', 'car-t', 'cart', 'mrna delivery', 'crispr', 'viral vector', 'aav']
  },
  {
    id: 'funding',
    label: 'Funding',
    keywords: ['funding', 'financing', 'series a', 'series b', 'venture', 'investment', 'raise', 'ipo', 'acquisition']
  },
  {
    id: 'hiring',
    label: 'Hiring',
    keywords: ['hiring', 'layoff', 'workforce', 'jobs', 'talent', 'restructuring']
  },
  {
    id: 'translational medicine',
    label: 'Translational Medicine',
    keywords: ['translational', 'biomarker', 'patient stratification', 'precision medicine', 'companion diagnostic', 'clinical']
  },
  {
    id: 'immunology',
    label: 'Immunology',
    keywords: ['immunology', 'immune', 'inflammation', 'innate immune', 'adaptive immune', 'cytokine', 't cell', 'b cell']
  }
];

export const DEFAULT_TOPIC_BUCKETS: TopicKey[] = ['biotech'];
