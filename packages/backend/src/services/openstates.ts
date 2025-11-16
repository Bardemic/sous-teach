import { TRPCError } from '@trpc/server';

const OPENSTATES_BASE_URL = 'https://v3.openstates.org';

interface OpenStatesConfig {
  apiKey: string;
}

// OpenStates API types
export interface Bill {
  id: string;
  identifier: string;
  title: string;
  classification: string[];
  subject: string[];
  latest_action_description?: string;
  latest_action_date?: string;
  latest_passage_date?: string;
  from_organization?: {
    id: string;
    name: string;
    classification: string;
  };
  abstracts?: Array<{
    abstract: string;
    note?: string;
  }>;
  first_action_date?: string;
  updated_at?: string;
  openstates_url?: string;
  sources?: Array<{
    url: string;
    note?: string;
  }>;
}

export interface BillsResponse {
  results: Bill[];
  pagination: {
    page: number;
    max_page: number;
    per_page: number;
    total_items: number;
  };
}

export interface Person {
  id: string;
  name: string;
  current_role?: {
    title: string;
    org_classification: string;
    district?: string;
    division_id?: string;
  };
  party?: Array<{
    name: string;
  }>;
  email?: string;
  links?: Array<{
    url: string;
    note?: string;
  }>;
  offices?: Array<{
    name: string;
    voice?: string;
    fax?: string;
    email?: string;
    address?: string;
  }>;
  image?: string;
}

export interface PeopleResponse {
  results: Person[];
  pagination?: {
    page: number;
    max_page: number;
    per_page: number;
    total_items: number;
  };
}

export class OpenStatesService {
  private config: OpenStatesConfig;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenStates API key is required');
    }
    this.config = { apiKey };
  }

  private async fetchFromAPI<T>(endpoint: string, params: Record<string, string> = {}, retries = 3): Promise<T> {
    const url = new URL(`${OPENSTATES_BASE_URL}${endpoint}`);

    // Add API key
    url.searchParams.append('apikey', this.config.apiKey);

    // Add other params
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url.toString());

        // If rate limited (429) or server error (5xx), retry with exponential backoff
        if ((response.status === 429 || response.status >= 500) && attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();

          // Provide more helpful error for rate limiting
          if (response.status === 429) {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: 'OpenStates API rate limit exceeded. Please try again in a few minutes.',
            });
          }

          throw new TRPCError({
            code: 'BAD_GATEWAY',
            message: `OpenStates API error (${response.status}): ${errorText}`,
          });
        }

        return await response.json();
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        // If it's the last retry, throw the error
        if (attempt === retries) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to fetch from OpenStates: ${error instanceof Error ? error.message : 'Unknown error'}`,
            cause: error,
          });
        }

        // Otherwise, wait and retry
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected error in OpenStates API fetch',
    });
  }

  /**
   * Search for bills by jurisdiction and other filters
   */
  async searchBills(params: {
    jurisdiction: string;
    session?: string;
    updated_since?: string;
    per_page?: number;
    page?: number;
    sort?: 'updated_asc' | 'updated_desc' | 'first_action_asc' | 'first_action_desc' | 'latest_action_asc' | 'latest_action_desc';
  }): Promise<BillsResponse> {
    const queryParams: Record<string, string> = {
      jurisdiction: params.jurisdiction,
      per_page: params.per_page?.toString() || '20',
      page: params.page?.toString() || '1',
    };

    if (params.session) {
      queryParams.session = params.session;
    }

    if (params.updated_since) {
      queryParams.updated_since = params.updated_since;
    }

    if (params.sort) {
      queryParams.sort = params.sort;
    }

    return this.fetchFromAPI<BillsResponse>('/bills', queryParams);
  }

  /**
   * Find legislators by geographic coordinates
   */
  async findLegislatorsByLocation(lat: number, lng: number): Promise<PeopleResponse> {
    return this.fetchFromAPI<PeopleResponse>('/people.geo', {
      lat: lat.toString(),
      lng: lng.toString(),
    });
  }

  /**
   * Search for people by jurisdiction
   */
  async searchPeople(params: {
    jurisdiction: string;
    per_page?: number;
    page?: number;
  }): Promise<PeopleResponse> {
    return this.fetchFromAPI<PeopleResponse>('/people', {
      jurisdiction: params.jurisdiction,
      per_page: params.per_page?.toString() || '20',
      page: params.page?.toString() || '1',
    });
  }

  /**
   * Get jurisdiction ID from state abbreviation or name
   * Common format: 'ocd-jurisdiction/country:us/state:ma/government'
   */
  static getJurisdictionId(state: string): string {
    // Map full state names and abbreviations to lowercase state codes
    const stateMap: Record<string, string> = {
      // Abbreviations
      'al': 'al', 'ak': 'ak', 'az': 'az', 'ar': 'ar', 'ca': 'ca', 'co': 'co', 'ct': 'ct',
      'de': 'de', 'fl': 'fl', 'ga': 'ga', 'hi': 'hi', 'id': 'id', 'il': 'il', 'in': 'in',
      'ia': 'ia', 'ks': 'ks', 'ky': 'ky', 'la': 'la', 'me': 'me', 'md': 'md', 'ma': 'ma',
      'mi': 'mi', 'mn': 'mn', 'ms': 'ms', 'mo': 'mo', 'mt': 'mt', 'ne': 'ne', 'nv': 'nv',
      'nh': 'nh', 'nj': 'nj', 'nm': 'nm', 'ny': 'ny', 'nc': 'nc', 'nd': 'nd', 'oh': 'oh',
      'ok': 'ok', 'or': 'or', 'pa': 'pa', 'ri': 'ri', 'sc': 'sc', 'sd': 'sd', 'tn': 'tn',
      'tx': 'tx', 'ut': 'ut', 'vt': 'vt', 'va': 'va', 'wa': 'wa', 'wv': 'wv', 'wi': 'wi',
      'wy': 'wy', 'dc': 'dc',
      // Full names
      'alabama': 'al', 'alaska': 'ak', 'arizona': 'az', 'arkansas': 'ar', 'california': 'ca',
      'colorado': 'co', 'connecticut': 'ct', 'delaware': 'de', 'florida': 'fl', 'georgia': 'ga',
      'hawaii': 'hi', 'idaho': 'id', 'illinois': 'il', 'indiana': 'in', 'iowa': 'ia',
      'kansas': 'ks', 'kentucky': 'ky', 'louisiana': 'la', 'maine': 'me', 'maryland': 'md',
      'massachusetts': 'ma', 'michigan': 'mi', 'minnesota': 'mn', 'mississippi': 'ms',
      'missouri': 'mo', 'montana': 'mt', 'nebraska': 'ne', 'nevada': 'nv', 'new hampshire': 'nh',
      'new jersey': 'nj', 'new mexico': 'nm', 'new york': 'ny', 'north carolina': 'nc',
      'north dakota': 'nd', 'ohio': 'oh', 'oklahoma': 'ok', 'oregon': 'or', 'pennsylvania': 'pa',
      'rhode island': 'ri', 'south carolina': 'sc', 'south dakota': 'sd', 'tennessee': 'tn',
      'texas': 'tx', 'utah': 'ut', 'vermont': 'vt', 'virginia': 'va', 'washington': 'wa',
      'west virginia': 'wv', 'wisconsin': 'wi', 'wyoming': 'wy', 'district of columbia': 'dc',
    };

    const normalizedState = state.toLowerCase().trim();
    const stateCode = stateMap[normalizedState];

    if (!stateCode) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Invalid state: ${state}`,
      });
    }

    return `ocd-jurisdiction/country:us/state:${stateCode}/government`;
  }
}
