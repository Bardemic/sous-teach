import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearch, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { IssueCard } from '../../components/IssueCard/IssueCard';
import { OpportunityCard } from '../../components/OpportunityCard/OpportunityCard';
import { trpc } from '../../lib/trpc';
import type { RouterOutputs } from '@sous-chef/api-types';
import styles from './CivicSnapshot.module.css';

type Category = 'all' | 'housing' | 'transit' | 'safety' | 'construction' | 'campus' | 'misc';

// When you fetch from Exa AI or your backend, return data matching these interfaces:
export interface CivicDataResponse {
  location: {
    zipCode: string;
    city: string;
    state: string;
    county: string;
  };
  representatives: Array<{
    name: string;
    position: string;
    email?: string;
    phone?: string;
  }>;
  issues: Array<{
    id: string;
    title: string;
    summary: string;
    category: 'housing' | 'transit' | 'safety' | 'construction' | 'campus' | 'misc';
    impact: 'high' | 'medium' | 'low';
  }>;
}

type OpportunitiesResponse = RouterOutputs['community']['search'];
type Opportunity = OpportunitiesResponse['opportunities'][number];
type LocationProfile = CivicDataResponse['location'] & { country: string };

const SKELETON_CARD_COUNT = 3;

const ZIP_PRESETS: Record<string, LocationProfile> = {
  '02139': {
    zipCode: '02139',
    city: 'Cambridge',
    state: 'Massachusetts',
    county: 'Middlesex County',
    country: 'United States',
  },
  '10001': {
    zipCode: '10001',
    city: 'New York',
    state: 'New York',
    county: 'New York County',
    country: 'United States',
  },
  '94103': {
    zipCode: '94103',
    city: 'San Francisco',
    state: 'California',
    county: 'San Francisco County',
    country: 'United States',
  },
};

const DEFAULT_LOCATION: LocationProfile = ZIP_PRESETS['02139'];

const MOCK_REPS = [
  { name: 'Alexandria Chen', position: 'City Council, Dist. 3', email: 'achen@city.gov', phone: '(555) 123-4567' },
  { name: 'Marcus Williams', position: 'State Representative', email: 'mwilliams@state.gov', phone: '(555) 234-5678' },
  { name: 'Sarah Johnson', position: 'U.S. Congress, Dist. 7', email: 'sjohnson@house.gov', phone: '(555) 345-6789' },
  { name: 'David Park', position: 'Mayor', email: 'mayor@city.gov', phone: '(555) 456-7890' },
];

const MOCK_ISSUES = [
  {
    id: '1',
    title: 'New bike lanes planned for Main Street',
    summary: 'The city is adding protected bike lanes along Main Street between 5th and 12th Ave. Construction starts next month and will run through summer. Officials say this is part of a broader initiative to make the city more bike-friendly and reduce traffic congestion in the downtown core.',
    category: 'transit' as const,
    impact: 'medium' as const,
  },
  {
    id: '2',
    title: 'Affordable housing development approved',
    summary: 'City council approved 150 units of affordable housing near the metro station. Units will be available for households earning 60% or less of area median income.',
    category: 'housing' as const,
    impact: 'high' as const,
  },
  {
    id: '3',
    title: 'Library renovation scheduled',
    summary: 'The downtown library will close for renovations from March to August. Temporary services will be available at the community center.',
    category: 'campus' as const,
    impact: 'low' as const,
  },
  {
    id: '4',
    title: 'Increased police patrols in downtown area',
    summary: 'Following recent incidents, the police department is adding evening patrols in the downtown entertainment district on weekends.',
    category: 'safety' as const,
    impact: 'medium' as const,
  },
  {
    id: '5',
    title: 'Bridge repair causing detours',
    summary: 'The Oak Street bridge is under repair. Drivers should expect detours and delays for the next 6 weeks. Follow posted signs for alternative routes.',
    category: 'construction' as const,
    impact: 'high' as const,
  },
];

export function CivicSnapshot() {
  const search = useSearch({ strict: false }) as {
    zip?: string;
    city?: string;
    state?: string;
    county?: string;
  };
  const zipParam = search.zip?.trim() || '';
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [liveOpportunities, setLiveOpportunities] = useState<Opportunity[]>([]);
  const {
    mutate: fetchOpportunities,
    isPending: isFetchingOpportunities,
    isError: isOpportunityError,
    error: opportunityError,
    reset: resetOpportunityError,
  } = trpc.community.search.useMutation({
    onSuccess(data) {
      setLiveOpportunities(data.opportunities);
    },
  });
  const lastFetchedLocationRef = useRef<string | null>(null);

  const locationProfile = useMemo<LocationProfile>(() => {
    // If we have city and state from the URL (from zip lookup), use that
    if (search.city && search.state) {
      return {
        zipCode: zipParam || DEFAULT_LOCATION.zipCode,
        city: search.city,
        state: search.state,
        county: search.county || 'County TBD',
        country: 'United States',
      };
    }

    // Fall back to presets if available
    if (zipParam && ZIP_PRESETS[zipParam]) {
      return ZIP_PRESETS[zipParam];
    }

    // Default fallback
    return {
      ...DEFAULT_LOCATION,
      zipCode: zipParam || DEFAULT_LOCATION.zipCode,
    };
  }, [zipParam, search.city, search.state, search.county]);

  const locationKey = `${locationProfile.city}|${locationProfile.state}|${locationProfile.country}`;

  useEffect(() => {
    if (
      !locationProfile.city ||
      !locationProfile.state ||
      !locationProfile.country ||
      lastFetchedLocationRef.current === locationKey
    ) {
      return;
    }

    lastFetchedLocationRef.current = locationKey;
    fetchOpportunities({
      city: locationProfile.city,
      state: locationProfile.state,
      country: locationProfile.country,
    });
  }, [fetchOpportunities, locationKey, locationProfile.city, locationProfile.country, locationProfile.state]);

  const opportunityCount = liveOpportunities.length;
  const shouldShowSkeletons = isFetchingOpportunities && opportunityCount === 0;

  const handleRefreshOpportunities = () => {
    resetOpportunityError();
    fetchOpportunities({
      city: locationProfile.city,
      state: locationProfile.state,
      country: locationProfile.country,
    });
  };

  // TODO: Replace with real API call
  // const { data, isLoading } = useQuery({
  //   queryKey: ['civic-data', zip],
  //   queryFn: () => fetch(`/api/civic/${zip}`).then(r => r.json() as Promise<CivicDataResponse>)
  // });
  // const cityName = data?.location.city || 'Loading...';
  // const stateName = data?.location.state || '';
  // const representatives = data?.representatives || [];
  // const issues = data?.issues || [];

  const cityName = locationProfile.city;
  const stateName = locationProfile.state;
  const countyName = locationProfile.county || 'County TBD';
  const locationBadgeValue = zipParam || locationProfile.zipCode;

  const categories: Category[] = ['all', 'housing', 'transit', 'safety', 'construction', 'campus', 'misc'];

  // Filter and sort by impact: high -> medium -> low
  const impactOrder = { high: 0, medium: 1, low: 2 };
  const filteredIssues = (activeCategory === 'all'
    ? MOCK_ISSUES
    : MOCK_ISSUES.filter((issue) => issue.category === activeCategory)
  ).sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  const handleExplainSimpler = (title: string) => {
    alert(`Explain simpler: ${title}`);
  };

  const handleContactReps = (title: string) => {
    alert(`Contact reps about: ${title}`);
  };

  const handleSave = (title: string) => {
    alert(`Saved: ${title}`);
  };

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.masthead}>
        <div className={styles.mastheadTop}>
          <Link to="/" className={styles.backButton}>
            ← Change ZIP
          </Link>
          <div className={styles.locationBadge}>ZIP {locationBadgeValue}</div>
          <div className={styles.date}>{dateString}</div>
        </div>

        <div className={styles.pageTitle}>
          <h1 className={styles.mainHeadline}>
            {cityName}, {stateName}
          </h1>
          <p className={styles.subheadline}>Community Civic Report</p>
        </div>

        <div className={styles.mastheadBottom}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>POP:</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>COUNTY:</span>
            <span>{countyName}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>LEADS:</span>
            <span>{opportunityCount}</span>
          </div>
        </div>
      </div>

      <section className={styles.dailySummary}>
        <div className={styles.summaryBox}>
          <div className={styles.summaryLabel}>Today's Civic Summary</div>
          <h2 className={styles.summaryHeadline}>
            Community Action in Motion
          </h2>
          <p className={styles.summaryText}>
            From transportation improvements to affordable housing initiatives, your community is buzzing with civic activity.
            Stay informed about the decisions that shape your neighborhood and discover how you can make your voice heard.
            Whether it's new bike lanes on Main Street or affordable housing developments near transit hubs, these local issues
            directly impact your daily life and deserve your attention.
          </p>
          <div className={styles.summaryStats}>
            <div className={styles.summaryStatItem}>
              <span className={styles.summaryStatNumber}>{MOCK_ISSUES.length}</span>
              <span className={styles.summaryStatLabel}>Active Issues</span>
            </div>
            <div className={styles.summaryStatItem}>
              <span className={styles.summaryStatNumber}>{MOCK_REPS.length}</span>
              <span className={styles.summaryStatLabel}>Representatives</span>
            </div>
            <div className={styles.summaryStatItem}>
              <span className={styles.summaryStatNumber}>{opportunityCount}</span>
              <span className={styles.summaryStatLabel}>Live Leads</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.opportunitiesSection}>
        <div className={styles.opportunitiesHeader}>
          <div>
            <div className={styles.opportunitiesLabel}>Live Civic Leads</div>
            <h2 className={styles.opportunitiesTitle}>
              Ways to Plug In Around {cityName}
            </h2>
            <p className={styles.opportunitiesSubtitle}>
              Pulled directly from Civic Scout for {cityName}, {stateName}. This feed only shows verified opportunities.
            </p>
          </div>
        </div>

        {isOpportunityError && (
          <div className={styles.opportunitiesError}>
            We couldn’t reach the backend ({opportunityError?.message ?? 'unknown error'}), so no leads are available right now.
            <button
              className={styles.tryAgainButton}
              type="button"
              onClick={handleRefreshOpportunities}
              disabled={isFetchingOpportunities}
            >
              Try again
            </button>
          </div>
        )}

        {!isFetchingOpportunities && opportunityCount === 0 && !isOpportunityError && (
          <div className={styles.opportunitiesStatus}>
            No civic leads surfaced yet for this ZIP. Try refreshing or checking back later.
          </div>
        )}

        {shouldShowSkeletons && (
          <div className={styles.opportunitiesList}>
            {Array.from({ length: SKELETON_CARD_COUNT }, (_, idx) => (
              <OpportunityCard
                key={`opportunity-skeleton-${idx}`}
                title={`Loading opportunity ${idx + 1}`}
                isSkeleton
              />
            ))}
          </div>
        )}

        {opportunityCount > 0 && (
          <div className={styles.opportunitiesList}>
            {liveOpportunities.map((opportunity) => (
              <OpportunityCard
                key={`${opportunity.title}-${opportunity.url ?? opportunity.title}`}
                title={opportunity.title}
                organization={opportunity.organization}
                url={opportunity.url}
                date={opportunity.date}
                location={opportunity.location}
                focus={opportunity.focus}
                description={opportunity.description}
              />
            ))}
          </div>
        )}
      </section>

      <div className={styles.filtersSection}>
        <div className={styles.filtersTitle}>— Filter News by Category —</div>
        <div className={styles.filters}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterButton} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat)}
              type="button"
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      <section className={styles.newsSection}>
        <div className={styles.newsGrid}>
          {/* Representatives Sidebar */}
          <aside className={styles.repsSidebar}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Your Representatives</h3>
            </div>
            <div className={styles.repsList}>
              {MOCK_REPS.map((rep) => (
                <div key={rep.name} className={styles.repItem}>
                  <h4 className={styles.repName}>{rep.name}</h4>
                  <p className={styles.repPosition}>{rep.position}</p>
                  <div className={styles.repActions}>
                    {rep.email && (
                      <a href={`mailto:${rep.email}`} className={styles.repButton}>
                        Email
                      </a>
                    )}
                    {rep.phone && (
                      <a href={`tel:${rep.phone}`} className={styles.repButton}>
                        Call
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* News Articles */}
          {filteredIssues.map((issue, index) => {
            // Size articles based on impact level
            const articleClass = issue.impact === 'high'
              ? styles.articleHigh
              : issue.impact === 'medium'
                ? styles.articleMedium
                : styles.articleLow;

            return (
              <div key={issue.id} className={articleClass}>
                <IssueCard
                  {...issue}
                  index={index}
                  onExplainSimpler={() => handleExplainSimpler(issue.title)}
                  onContactReps={() => handleContactReps(issue.title)}
                  onSave={() => handleSave(issue.title)}
                />
              </div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}
