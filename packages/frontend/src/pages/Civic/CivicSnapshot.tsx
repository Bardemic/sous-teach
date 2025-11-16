import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearch, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { IssueCard } from '../../components/IssueCard/IssueCard';
import type { IssueCardProps } from '../../components/IssueCard/IssueCard';
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
type BillResult = RouterOutputs['openstates']['searchBills']['bills'][number];
type LegislatorResult = RouterOutputs['openstates']['findLegislatorsByLocation']['legislators'][number];
type IssueDisplay = IssueCardProps & { id: string; bill?: BillResult };

function getBillSummary(bill?: BillResult | null) {
  if (!bill) {
    return '';
  }
  return bill.abstracts?.[0]?.abstract
    || bill.latest_action_description
    || 'No description available yet.';
}

function getBillUrl(bill?: BillResult | null) {
  return bill?.openstates_url || bill?.sources?.[0]?.url;
}

function getBillSponsor(bill?: BillResult | null) {
  const sponsorship = bill?.sponsorships?.find((sponsor) => sponsor.primary) || bill?.sponsorships?.[0];
  return sponsorship?.name || sponsorship?.person?.name;
}

function getBillLevel(bill?: BillResult | null): 'local' | 'state' | 'federal' {
  const classification = bill?.jurisdiction?.classification?.toLowerCase();
  if (!classification) {
    return 'state';
  }
  if (classification.includes('country')) {
    return 'federal';
  }
  if (classification.includes('municipality') || classification.includes('city') || classification.includes('county')) {
    return 'local';
  }
  return 'state';
}

function formatRepresentativeTitle(rep?: LegislatorResult | null) {
  if (!rep?.current_role?.title) {
    return 'Representative';
  }
  if (rep.current_role.district) {
    return `${rep.current_role.title}, Dist. ${rep.current_role.district}`;
  }
  return rep.current_role.title;
}

function getRepresentativeEmail(rep?: LegislatorResult | null): string | undefined {
  const email = rep?.email || rep?.offices?.find((office) => office.email)?.email;
  if (!email) return undefined;
  const trimmed = email.trim();
  // Basic email validation - must contain @ and be non-empty
  if (trimmed && trimmed.includes('@') && trimmed.length > 3) {
    return trimmed;
  }
  return undefined;
}

function getRepresentativePhone(rep?: LegislatorResult | null) {
  return rep?.offices?.find((office) => office.voice)?.voice;
}

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

const SKELETON_ISSUES: IssueDisplay[] = Array.from({ length: 5 }, (_, i) => ({
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
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [explainIssue, setExplainIssue] = useState<{ title: string; summary: string } | null>(null);
  const [selectedBill, setSelectedBill] = useState<BillResult | null>(null);
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [stance, setStance] = useState<'support' | 'oppose'>('support');
  const [tone, setTone] = useState<'formal' | 'conversational'>('formal');
  const [reason, setReason] = useState('');
  const [senderName, setSenderName] = useState('');
  const [bills, setBills] = useState<BillResult[]>([]);
  const [representatives, setRepresentatives] = useState<LegislatorResult[]>([]);
  const [isAdvocacyPanelOpen, setIsAdvocacyPanelOpen] = useState(false);
  const advocacyPanelRef = useRef<HTMLDivElement | null>(null);
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
  const {
    mutate: generateAdvocacyEmail,
    data: draftResult,
    isPending: isGeneratingEmail,
    error: draftError,
    reset: resetDraftResult,
  } = trpc.advocacy.draftEmail.useMutation({
    onSuccess(data) {
      if (typeof window !== 'undefined') {
        window.open(data.gmailComposeUrl, '_blank', 'noopener,noreferrer');
      }
    },
  });

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

  useEffect(() => {
    if (!selectedBill && bills.length > 0) {
      const firstBill = bills[0];
      setSelectedBill(firstBill);
      if (!reason.trim()) {
        setReason(getBillSummary(firstBill));
      }
    }
  }, [bills, selectedBill, reason]);

  useEffect(() => {
    if (representatives.length === 0) {
      return;
    }
    setSelectedRepId((current) => {
      if (current && representatives.some((rep) => rep.id === current)) {
        return current;
      }
      const withEmail = representatives.find((rep) => getRepresentativeEmail(rep));
      return withEmail?.id ?? representatives[0].id;
    });
  }, [representatives]);

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

  const selectedRepresentative = useMemo(
    () => (selectedRepId ? representatives.find((rep) => rep.id === selectedRepId) : undefined),
    [representatives, selectedRepId],
  );
  const selectedRepresentativeEmail = getRepresentativeEmail(selectedRepresentative);
  const selectedRepresentativePhone = getRepresentativePhone(selectedRepresentative);
  const selectedBillSummary = getBillSummary(selectedBill);
  const selectedBillUrl = getBillUrl(selectedBill);
  const selectedBillSponsor = getBillSponsor(selectedBill);
  const selectedBillLevel = getBillLevel(selectedBill);
  const categories: Category[] = ['all', 'housing', 'transit', 'safety', 'construction', 'campus', 'misc'];
  const clearDraftIfNeeded = () => {
    if (draftResult || draftError) {
      resetDraftResult();
    }
  };

  // Transform bills into issues format only when not loading
  const billsAsIssues: IssueDisplay[] = useMemo(() => {
    if (isBillsLoading || bills.length === 0) {
      return [];
    }
    return bills.map((bill) => {
      // Categorize bills based on subjects and classification
      let category: Category = 'misc';
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
        summary: getBillSummary(bill),
        category,
        impact,
        sourceUrl: getBillUrl(bill),
        bill,
      };
    });
  }, [bills, isBillsLoading]);

  // Show ONLY skeletons while loading, ONLY real data when loaded, or empty if error
  const allIssues: IssueDisplay[] = isBillsLoading ? SKELETON_ISSUES : isBillsError ? [] : billsAsIssues;

  // Filter and sort by impact: high -> medium -> low
  const impactOrder = { high: 0, medium: 1, low: 2 };
  const filteredIssues: IssueDisplay[] = (activeCategory === 'all'
    ? allIssues
    : allIssues.filter((issue) => issue.category === activeCategory)
  ).sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  const handleExplainSimpler = (issue: IssueDisplay) => {
    setExplainIssue({ title: issue.title, summary: issue.summary });
    setIsExplainModalOpen(true);
  };

  const isAdvocacyReady = Boolean(
    selectedBill && selectedRepresentative && selectedRepresentativeEmail && reason.trim().length >= 25,
  );

  const handleContactReps = (issue: IssueDisplay) => {
    if (!issue.bill) {
      return;
    }
    setSelectedBill(issue.bill);
    if (!reason.trim()) {
      setReason(issue.summary);
    }
    setIsAdvocacyPanelOpen(true);
    clearDraftIfNeeded();
    setTimeout(() => {
      advocacyPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleGenerateEmail = () => {
    if (!isAdvocacyReady || !selectedBill || !selectedRepresentative || !selectedRepresentativeEmail) {
      return;
    }

    // Validate email format before sending
    const trimmedEmail = selectedRepresentativeEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@') || trimmedEmail.length < 5) {
      console.error('Invalid email address:', trimmedEmail);
      return;
    }

    generateAdvocacyEmail({
      bill: {
        id: selectedBill.id,
        title: `${selectedBill.identifier}: ${selectedBill.title}`,
        summary: selectedBillSummary,
        level: selectedBillLevel,
        status: selectedBill.latest_action_description,
        sponsor: selectedBillSponsor,
        url: selectedBillUrl,
      },
      stance: {
        position: stance,
        reason: reason.trim(),
      },
      representative: {
        name: selectedRepresentative.name,
        title: formatRepresentativeTitle(selectedRepresentative),
        email: trimmedEmail,
      },
      tone,
      senderName: senderName.trim() || undefined,
      location: {
        city: locationProfile.city,
        state: locationProfile.state,
      },
    });
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
            const issueCardProps: IssueCardProps = {
              title: issue.title,
              summary: issue.summary,
              category: issue.category,
              impact: issue.impact,
              sourceUrl: issue.sourceUrl,
              isSkeleton: issue.isSkeleton,
            };

            return (
              <div key={issue.id} className={articleClass}>
                <IssueCard
                  {...issueCardProps}
                  index={index}
                  onExplainSimpler={() => handleExplainSimpler(issue)}
                  onContactReps={() => handleContactReps(issue)}
                  onSave={() => handleSave(issue.title)}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Advocacy Panel - Collapsible */}
      <section className={styles.advocacySection} ref={advocacyPanelRef} id="contact-panel">
        <button
          className={styles.advocacyToggle}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsAdvocacyPanelOpen(!isAdvocacyPanelOpen);
          }}
        >
          <div className={styles.advocacyToggleContent}>
            <div>
              <p className={styles.advocacyLabel}>Direct Line to Action</p>
              <h2 className={styles.advocacyTitle}>
                {selectedBill ? `Email your reps about ${selectedBill.identifier}` : 'Contact Your Representatives'}
              </h2>
            </div>
            <span className={styles.advocacyToggleIcon}>
              {isAdvocacyPanelOpen ? '−' : '+'}
            </span>
          </div>
        </button>

        {isAdvocacyPanelOpen && (
          <div className={styles.advocacyBody}>
            <p className={styles.advocacyHint}>
              Choose a bill from the grid, select a representative, and automatically draft a Gmail-ready message with AI.
            </p>

            <div className={styles.advocacyContent}>
              <div className={styles.billColumn}>
                {selectedBill ? (
                  <>
                    <div className={styles.billMeta}>
                      <span className={styles.billChip}>{selectedBill.identifier}</span>
                      <span className={styles.billLevel}>{selectedBillLevel.toUpperCase()} LEVEL</span>
                    </div>
                    <h3 className={styles.billHeadline}>{selectedBill.title}</h3>
                    <p className={styles.billSummary}>{selectedBillSummary}</p>
                    <ul className={styles.billDetails}>
                      <li>
                        <span>Status</span>
                        <p>{selectedBill.latest_action_description || 'No recent actions listed.'}</p>
                      </li>
                      {selectedBillSponsor && (
                        <li>
                          <span>Sponsor</span>
                          <p>{selectedBillSponsor}</p>
                        </li>
                      )}
                      {selectedBillUrl && (
                        <li>
                          <span>Source</span>
                          <p>
                            <a href={selectedBillUrl} target="_blank" rel="noreferrer">
                              View the full bill →
                            </a>
                          </p>
                        </li>
                      )}
                    </ul>
                  </>
                ) : (
                  <p className={styles.emptyState}>
                    Select any bill in the news grid to load its summary and start contacting officials.
                  </p>
                )}

                {bills.length > 1 && (
                  <div className={styles.billQuickPick}>
                    <span>Quick switch</span>
                    <div className={styles.billQuickPickList}>
                      {bills.slice(0, 5).map((bill) => (
                        <button
                          key={bill.id}
                          className={`${styles.billQuickPickButton} ${selectedBill?.id === bill.id ? styles.active : ''}`}
                          type="button"
                          onClick={() => {
                            setSelectedBill(bill);
                            if (!reason.trim()) {
                              setReason(getBillSummary(bill));
                            }
                            clearDraftIfNeeded();
                          }}
                        >
                          {bill.identifier}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.advocacyForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="representative">Representative</label>
                  <select
                    id="representative"
                    value={selectedRepId ?? ''}
                    onChange={(event) => {
                      setSelectedRepId(event.target.value);
                      clearDraftIfNeeded();
                    }}
                    disabled={representatives.length === 0}
                  >
                    {representatives.length === 0 && <option value="">No representatives found</option>}
                    {representatives.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.name} — {formatRepresentativeTitle(rep)}
                      </option>
                    ))}
                  </select>
                  {selectedRepresentative && (
                    <p className={styles.helperText}>
                      {formatRepresentativeTitle(selectedRepresentative)}
                      {selectedRepresentativePhone ? ` • ${selectedRepresentativePhone}` : ''}
                    </p>
                  )}
                  {!selectedRepresentativeEmail && selectedRepresentative && (
                    <div className={styles.warningBox}>
                      We don&apos;t have an email for this representative. Try another official to send an email.
                    </div>
                  )}
                </div>

                <div className={styles.inlineToggles}>
                  <div>
                    <span className={styles.toggleLabel}>Stance</span>
                    <div className={styles.toggleGroup}>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${stance === 'support' ? styles.toggleButtonActive : ''}`}
                        onClick={() => {
                          setStance('support');
                          clearDraftIfNeeded();
                        }}
                      >
                        Support
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${stance === 'oppose' ? styles.toggleButtonActive : ''}`}
                        onClick={() => {
                          setStance('oppose');
                          clearDraftIfNeeded();
                        }}
                      >
                        Oppose
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className={styles.toggleLabel}>Tone</span>
                    <div className={styles.toggleGroup}>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${tone === 'formal' ? styles.toggleButtonActive : ''}`}
                        onClick={() => {
                          setTone('formal');
                          clearDraftIfNeeded();
                        }}
                      >
                        Formal
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${tone === 'conversational' ? styles.toggleButtonActive : ''}`}
                        onClick={() => {
                          setTone('conversational');
                          clearDraftIfNeeded();
                        }}
                      >
                        Conversational
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="reason">Why is this important to you?</label>
                  <textarea
                    id="reason"
                    rows={5}
                    maxLength={750}
                    value={reason}
                    onChange={(event) => {
                      setReason(event.target.value);
                      clearDraftIfNeeded();
                    }}
                    placeholder="Share a short story or impact statement to personalize the message."
                  />
                  <div className={styles.helperText}>
                    {reason.trim().length < 25 ? 'Add at least 25 characters for context.' : 'Looks good!'}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="senderName">Your name (optional)</label>
                  <input
                    id="senderName"
                    type="text"
                    value={senderName}
                    onChange={(event) => {
                      setSenderName(event.target.value);
                      clearDraftIfNeeded();
                    }}
                    placeholder="Add your name so the draft can sign off properly."
                  />
                </div>

                {draftError && (
                  <div className={styles.errorBox}>
                    {draftError.message}
                  </div>
                )}

                <button
                  className={styles.generateButton}
                  type="button"
                  onClick={handleGenerateEmail}
                  disabled={!isAdvocacyReady || isGeneratingEmail}
                >
                  {isGeneratingEmail ? 'Drafting email...' : 'Generate Gmail Draft'}
                </button>

                {draftResult && (
                  <div className={styles.draftPreview}>
                    <div className={styles.draftRow}>
                      <span>Subject</span>
                      <p>{draftResult.subject}</p>
                    </div>
                    <div className={styles.draftRow}>
                      <span>Body preview</span>
                      <p>{draftResult.body}</p>
                    </div>
                    <div className={styles.previewActions}>
                      <a
                        href={draftResult.gmailComposeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.previewButton}
                      >
                        Open Gmail again
                      </a>
                      <button
                        type="button"
                        className={styles.previewButton}
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(`Subject: ${draftResult.subject}\n\n${draftResult.body}`);
                          }
                        }}
                      >
                        Copy message
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Explain Modal */}
      {explainIssue && (
        <ExplainModal
          isOpen={isExplainModalOpen}
          onClose={() => {
            setIsExplainModalOpen(false);
            setExplainIssue(null);
          }}
          billTitle={explainIssue.title}
          billSummary={explainIssue.summary}
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
