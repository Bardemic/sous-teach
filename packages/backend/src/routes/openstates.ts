import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { OpenStatesService } from '../services/openstates';

// Input schemas
const billsSearchSchema = z.object({
  state: z.string().min(2, 'State is required'),
  session: z.string().optional(),
  perPage: z.number().min(1).max(100).optional().default(20),
  page: z.number().min(1).optional().default(1),
});

const legislatorsByLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const legislatorsByStateSchema = z.object({
  state: z.string().min(2, 'State is required'),
  perPage: z.number().min(1).max(100).optional().default(20),
  page: z.number().min(1).optional().default(1),
});

const geocodeZipSchema = z.object({
  zipCode: z.string().length(5, 'ZIP code must be 5 digits'),
});

export interface GeocodeResponse {
  lat: number;
  lng: number;
  city: string;
  state: string;
  county?: string;
}

/**
 * Geocode a ZIP code to get coordinates
 * Uses zippopotam.us API which is free and doesn't require authentication
 */
async function geocodeZip(zipCode: string): Promise<GeocodeResponse> {
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);

    if (!response.ok) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `ZIP code ${zipCode} not found`,
      });
    }

    const data = await response.json();
    const place = data.places?.[0];

    if (!place) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `No location data found for ZIP code ${zipCode}`,
      });
    }

    // Extract coordinates
    const lat = parseFloat(place.latitude);
    const lng = parseFloat(place.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Invalid coordinates for ZIP code ${zipCode}`,
      });
    }

    return {
      lat,
      lng,
      city: place['place name'],
      state: place.state,
      county: place['county'] || undefined,
    };
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to geocode ZIP code: ${error instanceof Error ? error.message : 'Unknown error'}`,
      cause: error,
    });
  }
}

export const openstatesRouter = router({
  /**
   * Search for bills by state
   */
  searchBills: publicProcedure.input(billsSearchSchema).query(async ({ input }) => {
    if (!process.env.OPENSTATES_API_KEY) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Missing OPENSTATES_API_KEY',
      });
    }

    const service = new OpenStatesService(process.env.OPENSTATES_API_KEY);

    try {
      const jurisdiction = OpenStatesService.getJurisdictionId(input.state);

      const response = await service.searchBills({
        jurisdiction,
        session: input.session,
        per_page: input.perPage,
        page: input.page,
        sort: 'updated_desc', // Use valid sort parameter
      });

      return {
        bills: response.results,
        pagination: response.pagination,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch bills: ${error instanceof Error ? error.message : 'Unknown error'}`,
        cause: error,
      });
    }
  }),

  /**
   * Find legislators by geographic coordinates
   */
  findLegislatorsByLocation: publicProcedure
    .input(legislatorsByLocationSchema)
    .query(async ({ input }) => {
      if (!process.env.OPENSTATES_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Missing OPENSTATES_API_KEY',
        });
      }

      const service = new OpenStatesService(process.env.OPENSTATES_API_KEY);

      try {
        const response = await service.findLegislatorsByLocation(input.lat, input.lng);

        return {
          legislators: response.results,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch legislators: ${error instanceof Error ? error.message : 'Unknown error'}`,
          cause: error,
        });
      }
    }),

  /**
   * Find legislators by state
   */
  findLegislatorsByState: publicProcedure
    .input(legislatorsByStateSchema)
    .query(async ({ input }) => {
      if (!process.env.OPENSTATES_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Missing OPENSTATES_API_KEY',
        });
      }

      const service = new OpenStatesService(process.env.OPENSTATES_API_KEY);

      try {
        const jurisdiction = OpenStatesService.getJurisdictionId(input.state);

        const response = await service.searchPeople({
          jurisdiction,
          per_page: input.perPage,
          page: input.page,
        });

        return {
          legislators: response.results,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch legislators: ${error instanceof Error ? error.message : 'Unknown error'}`,
          cause: error,
        });
      }
    }),

  /**
   * Geocode a ZIP code to get coordinates
   */
  geocodeZip: publicProcedure.input(geocodeZipSchema).query(async ({ input }) => {
    return await geocodeZip(input.zipCode);
  }),
});
