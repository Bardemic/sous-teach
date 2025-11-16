import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearch, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { IssueCard } from '../../components/IssueCard/IssueCard';
import { OpportunityCard } from '../../components/OpportunityCard/OpportunityCard';
import { ExplainModal } from '../../components/ExplainModal/ExplainModal';
import { NewsletterSignup } from '../../components/NewsletterSignup/NewsletterSignup';
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

// Skeleton data for loading states
const SKELETON_REPS = Array.from({ length: 4 }, (_, i) => ({
  id: `skeleton-${i}`,
  name: 'Loading...',
  position: 'Loading...',
  isSkeleton: true,
}));

const SKELETON_ISSUES = Array.from({ length: 5 }, (_, i) => ({
  id: `skeleton-${i}`,
  title: 'Loading issue information...',
  summary: 'Please wait while we fetch the latest legislative information for your area.',
  category: 'misc' as const,
  impact: 'medium' as const,
  isSkeleton: true,
}));

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

  // Modal state
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<{ title: string; summary: string } | null>(null);
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

  // Fetch bills and legislators from OpenStates
  const [bills, setBills] = useState<Array<any>>([]);
  const [representatives, setRepresentatives] = useState<Array<any>>([]);

  // Geocode the ZIP code first - cache for 1 hour to avoid repeated lookups
  const {
    data: geocodeData,
  } = trpc.openstates.geocodeZip.useQuery(
    {
      zipCode: zipParam || DEFAULT_LOCATION.zipCode,
    },
    {
      enabled: !!(zipParam || DEFAULT_LOCATION.zipCode),
      staleTime: 1000 * 60 * 60, // 1 hour
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Only fetch bills once we have a state - cache for 10 minutes
  const {
    data: billsData,
    isLoading: isBillsLoading,
    isError: isBillsError,
  } = trpc.openstates.searchBills.useQuery(
    {
      state: search.state || DEFAULT_LOCATION.state,
      perPage: 10,
    },
    {
      enabled: !!(search.state || DEFAULT_LOCATION.state),
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Only fetch legislators once we have coordinates - cache for 10 minutes
  const {
    data: legislatorsData,
    isLoading: isLegislatorsLoading,
    isError: isLegislatorsError,
  } = trpc.openstates.findLegislatorsByLocation.useQuery(
    {
      lat: geocodeData?.lat || 0,
      lng: geocodeData?.lng || 0,
    },
    {
      enabled: !!(geocodeData?.lat && geocodeData?.lng),
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Update bills when data changes - only update if we're not loading
  useEffect(() => {
    if (billsData?.bills && !isBillsLoading) {
      setBills(billsData.bills);
    } else if (isBillsLoading) {
      setBills([]); // Clear bills while loading
    }
  }, [billsData, isBillsLoading]);

  // Update representatives when data changes - only update if we're not loading
  useEffect(() => {
    if (legislatorsData?.legislators && !isLegislatorsLoading) {
      // Sort representatives: Senate first, then House, alphabetically by name
      const sorted = [...legislatorsData.legislators].sort((a, b) => {
        const aTitle = a.current_role?.title?.toLowerCase() || '';
        const bTitle = b.current_role?.title?.toLowerCase() || '';
        const aIsSenate = aTitle.includes('senator');
        const bIsSenate = bTitle.includes('senator');

        // Senate comes first
        if (aIsSenate && !bIsSenate) return -1;
        if (!aIsSenate && bIsSenate) return 1;

        // Within same chamber, sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
      setRepresentatives(sorted);
    } else if (isLegislatorsLoading) {
      setRepresentatives([]); // Clear representatives while loading
    }
  }, [legislatorsData, isLegislatorsLoading]);

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

  const cityName = locationProfile.city;
  const stateName = locationProfile.state;
  const countyName = locationProfile.county || 'County TBD';
  const locationBadgeValue = zipParam || locationProfile.zipCode;

  const categories: Category[] = ['all', 'housing', 'transit', 'safety', 'construction', 'campus', 'misc'];

  // Transform bills into issues format only when not loading
  const billsAsIssues = !isBillsLoading && bills.length > 0 ? bills.map((bill) => {
    // Categorize bills based on subjects and classification
    let category: 'housing' | 'transit' | 'safety' | 'construction' | 'campus' | 'misc' = 'misc';
    const subjects = bill.subject || [];
    const title = bill.title.toLowerCase();

    if (subjects.some((s: string) => s.toLowerCase().includes('housing')) || title.includes('housing')) {
      category = 'housing';
    } else if (subjects.some((s: string) => s.toLowerCase().includes('transportation')) || title.includes('transit') || title.includes('transportation')) {
      category = 'transit';
    } else if (subjects.some((s: string) => s.toLowerCase().includes('public safety')) || title.includes('safety') || title.includes('police')) {
      category = 'safety';
    } else if (subjects.some((s: string) => s.toLowerCase().includes('infrastructure')) || title.includes('construction') || title.includes('infrastructure')) {
      category = 'construction';
    } else if (subjects.some((s: string) => s.toLowerCase().includes('education')) || title.includes('school') || title.includes('education')) {
      category = 'campus';
    }

    // Determine impact based on latest action or passage
    let impact: 'high' | 'medium' | 'low' = 'medium';
    if (bill.latest_passage_date) {
      impact = 'high'; // Bills that have passed are high impact
    } else if (bill.latest_action_date) {
      const actionDate = new Date(bill.latest_action_date);
      const daysSinceAction = (Date.now() - actionDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceAction < 7) {
        impact = 'high'; // Recent activity
      } else if (daysSinceAction < 30) {
        impact = 'medium';
      } else {
        impact = 'low';
      }
    }

    return {
      id: bill.id,
      title: `${bill.identifier}: ${bill.title}`,
      summary: bill.abstracts?.[0]?.abstract || bill.latest_action_description || 'No description available.',
      category,
      impact,
      sourceUrl: bill.openstates_url || bill.sources?.[0]?.url,
    };
  }) : [];

  // Show ONLY skeletons while loading, ONLY real data when loaded, or empty if error
  const allIssues = isBillsLoading ? SKELETON_ISSUES : isBillsError ? [] : billsAsIssues;

  // Filter and sort by impact: high -> medium -> low
  const impactOrder = { high: 0, medium: 1, low: 2 };
  const filteredIssues = (activeCategory === 'all'
    ? allIssues
    : allIssues.filter((issue) => issue.category === activeCategory)
  ).sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  const handleExplainSimpler = (title: string, summary: string) => {
    setSelectedIssue({ title, summary });
    setIsExplainModalOpen(true);
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
              <span className={styles.summaryStatNumber}>
                {isBillsLoading ? '...' : allIssues.length}
              </span>
              <span className={styles.summaryStatLabel}>Active Issues</span>
            </div>
            <div className={styles.summaryStatItem}>
              <span className={styles.summaryStatNumber}>
                {isLegislatorsLoading ? '...' : representatives.length}
              </span>
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

      {isBillsError && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600 }}>Unable to load legislative bills</p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            The OpenStates API rate limit may have been reached. Please try again in a few minutes.
          </p>
        </div>
      )}

      <section className={styles.newsSection}>
        <div className={styles.newsGrid}>
          {/* Representatives Sidebar */}
          <aside className={styles.repsSidebar}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Your Representatives</h3>
            </div>
            <div className={styles.repsList}>
              {isLegislatorsError && <div className={styles.repItem}>Unable to load representatives</div>}
              {isLegislatorsLoading
                ? SKELETON_REPS.map((rep) => (
                    <div key={rep.id} className={styles.repItem} style={{ opacity: 0.5 }}>
                      <h4 className={styles.repName}>{rep.name}</h4>
                      <p className={styles.repPosition}>{rep.position}</p>
                    </div>
                  ))
                : representatives.length > 0
                  ? representatives.map((rep) => {
                      const position = rep.current_role
                        ? `${rep.current_role.title}${rep.current_role.district ? `, Dist. ${rep.current_role.district}` : ''}`
                        : 'Representative';
                      const email = rep.email || rep.offices?.[0]?.email;
                      const phone = rep.offices?.[0]?.voice;

                      return (
                        <div key={rep.id} className={styles.repItem}>
                          <h4 className={styles.repName}>{rep.name}</h4>
                          <p className={styles.repPosition}>{position}</p>
                          {rep.party?.[0]?.name && (
                            <p className={styles.repPosition} style={{ fontSize: '0.85em', opacity: 0.8 }}>
                              {rep.party[0].name}
                            </p>
                          )}
                          <div className={styles.repActions}>
                            {email && (
                              <a href={`mailto:${email}`} className={styles.repButton}>
                                Email
                              </a>
                            )}
                            {phone && (
                              <a href={`tel:${phone}`} className={styles.repButton}>
                                Call
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  : <div className={styles.repItem}>No representatives found for this location</div>}
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
                  sourceUrl={(issue as any).sourceUrl}
                  isSkeleton={(issue as any).isSkeleton}
                  onExplainSimpler={() => handleExplainSimpler(issue.title, issue.summary)}
                  onContactReps={() => handleContactReps(issue.title)}
                  onSave={() => handleSave(issue.title)}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Explain Modal */}
      {selectedIssue && (
        <ExplainModal
          isOpen={isExplainModalOpen}
          onClose={() => setIsExplainModalOpen(false)}
          billTitle={selectedIssue.title}
          billSummary={selectedIssue.summary}
        />
      )}

      <section className={styles.newsletterWrapper}>
        <NewsletterSignup 
          zipCode={locationProfile.zipCode}
          city={locationProfile.city}
          state={locationProfile.state}
        />
      </section>
    </motion.div>
  );
}
