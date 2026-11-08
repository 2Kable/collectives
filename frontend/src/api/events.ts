import { apiClient } from "@/api/client";
import type { FlaskFilterPayload } from "@/components/CollectivesDataTable";
import { getGlobalContext } from "@/types/context";
import type { EventFiltersState, EventItem } from "@/types/event";

export interface LeaderSearchResult {
  id: number;
  full_name: string;
}

export interface EventsApiResponse {
  data: EventItem[];
  last_page: number;
  total?: number;
}

export async function searchLeaders(
  leaderNameQuery: string,
  resultLimit = 8,
): Promise<LeaderSearchResult[]> {
  const response = await apiClient.get<LeaderSearchResult[]>("/api/leaders/autocomplete/", {
    params: {
      q: leaderNameQuery,
      l: resultLimit,
    },
  });
  return response.data;
}

export function filtersToQuery(filters: EventFiltersState): FlaskFilterPayload[] {
  const filterPayload: FlaskFilterPayload[] = [];

  if (filters.title) {
    filterPayload.push({ field: "title", type: "like", value: filters.title });
  }

  const dateValue = filters.date ? filters.date.toISOString() : getGlobalContext().serverLocalTime;
  filterPayload.push({ field: "end", type: "like", value: dateValue });

  if (filters.leader) {
    filterPayload.push({ field: "leaders", type: "like", value: filters.leader });
  }

  if (!filters.displayCancelled) {
    filterPayload.push({ field: "status", type: "!=", value: "Cancelled" });
  }

  if (filters.activities.length > 0) {
    for (const activity of filters.activities) {
      filterPayload.push({ field: "activity_type", type: "=", value: activity });
    }
  }

  if (filters.eventTypes.length > 0) {
    for (const eventType of filters.eventTypes) {
      filterPayload.push({ field: "event_type", type: "=", value: eventType });
    }
  }

  if (filters.eventTags.length > 0) {
    for (const eventTag of filters.eventTags) {
      filterPayload.push({ field: "tags", type: "=", value: eventTag });
    }
  }

  return filterPayload;
}

export async function getEvents(
  pageParam: { page: number; pageSize: number },
  filters: EventFiltersState,
): Promise<EventsApiResponse> {
  const filterItems = filtersToQuery(filters);
  const params: Record<string, unknown> = {
    page: pageParam.page,
    size: pageParam.pageSize,
  };

  filterItems.forEach((item, index) => {
    params[`filters[${index}][field]`] = item.field;
    params[`filters[${index}][type]`] = item.type;
    params[`filters[${index}][value]`] = item.value;
  });

  const response = await apiClient.get<EventsApiResponse>("/api/events/", {
    params,
  });
  return response.data;
}
