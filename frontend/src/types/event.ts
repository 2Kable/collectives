export interface ActivityOption {
  id: string;
  short?: string;
  name: string;
  icon: string;
}

export interface ActivityGroup {
  kind: string;
  label: string;
  items: ActivityOption[];
}

export interface NamedOption {
  id: string;
  name: string;
}

export interface SiteParams {
  coverLogo: string;
  arrowDown: string;
  bannerMessage: string;
}

export interface EventLeader {
  id: number;
  full_name: string;
  avatar_uri: string;
}

export interface EventTypeInfo {
  id: number;
  short: string;
  name: string;
}

export interface EventTagInfo {
  short: string;
  name: string;
}

export interface EventItem {
  id: number;
  title: string;
  start: string;
  end: string;
  num_slots: number;
  num_online_slots: number;
  free_slots: number;
  occupied_slots: number;
  photo_uri: string;
  view_uri: string;
  leaders: EventLeader[];
  activity_types: ActivityOption[];
  activity_type_names: string;
  event_type: EventTypeInfo;
  is_confirmed: boolean;
  status: number | string;
  visibility: number;
  tags: EventTagInfo[];
  has_free_slots: boolean;
  has_free_waiting_slots: boolean;
  has_free_online_slots: boolean;
  formated_datetime_range: string;
}

export interface EventFiltersState {
  activities: string[];
  eventTypes: string[];
  eventTags: string[];
  date: Date | null;
  title: string;
  leader: string;
  displayCancelled: boolean;
}

export interface EventListProps {
  activityGroups: ActivityGroup[];
  eventTypes: NamedOption[];
  eventTags: NamedOption[];
  eventStatusLabels: Record<string, string>;
  isAuthenticated: boolean;
  siteParams: SiteParams;
  initialActivity?: string | null;
}
