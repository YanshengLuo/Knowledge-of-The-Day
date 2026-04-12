import type { TopicKey } from './topics';

export type PubMedQueryConfig = {
  label: string;
  query: string;
  tags: string[];
  topicBuckets: TopicKey[];
  maxResults: number;
};

export const PUBMED_QUERIES: PubMedQueryConfig[] = [
  {
    label: 'Computational oncology',
    query: '(computational biology) AND oncology',
    tags: ['computational biology', 'oncology'],
    topicBuckets: ['computational biology', 'oncology'],
    maxResults: 12
  },
  {
    label: 'Single-cell TME',
    query: '(single-cell OR scRNA-seq) AND (tumor microenvironment OR TME)',
    tags: ['single-cell', 'tumor microenvironment'],
    topicBuckets: ['single-cell', 'oncology', 'immunology'],
    maxResults: 12
  },
  {
    label: 'Gene therapy inflammation',
    query: '(gene therapy OR mRNA delivery) AND (innate immune response OR inflammation)',
    tags: ['gene therapy', 'mRNA delivery', 'inflammation'],
    topicBuckets: ['gene therapy', 'immunology'],
    maxResults: 12
  },
  {
    label: 'Spatial oncology',
    query: '(spatial transcriptomics) AND cancer',
    tags: ['spatial transcriptomics', 'cancer'],
    topicBuckets: ['spatial', 'oncology', 'computational biology'],
    maxResults: 12
  },
  {
    label: 'Biomarkers in oncology',
    query: '(biomarker OR patient stratification) AND oncology',
    tags: ['biomarker', 'patient stratification', 'oncology'],
    topicBuckets: ['translational medicine', 'oncology'],
    maxResults: 12
  }
];
