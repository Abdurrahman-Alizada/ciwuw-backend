import { Request, Response } from "express";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import * as path from "path";

const keyFilePath = path.join(__dirname, "../ciwuw-prod-c2927374d312.json");
const key = require(keyFilePath);

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: key.client_email,
    private_key: key.private_key,
  },
});

const property = "properties/439577016";

interface QueryParams {
  startDate?: string;
  endDate?: string;
}

const fetchAnalyticsData = async (
  startDate: string,
  endDate: string,
  dimensions: string[],
  metrics: string[]
) => {
  const [response] = await analyticsDataClient.runReport({
    property,
    dateRanges: [{ startDate, endDate }],
    metrics: metrics.map((name) => ({ name })),
    dimensions: dimensions.map((name) => ({ name })),
  });

  return response;
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return minutes > 0
    ? `${minutes} min ${remainingSeconds} sec`
    : `${remainingSeconds} sec`;
};

export const getAllAnalyticsData = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as QueryParams;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .send("Missing required query parameters: startDate and endDate");
  }

  try {
    // Convert ISO date strings to YYYY-MM-DD format
    const formattedStartDate = startDate.split("T")[0];
    const formattedEndDate = endDate.split("T")[0];

    // Fetch total users for the current time period
    const totalUsersResponse = await fetchAnalyticsData(
      formattedStartDate,
      formattedEndDate,
      [],
      ["totalUsers"]
    );

    let totalUsers = 0;
    totalUsersResponse.rows?.forEach((row) => {
      const metrics = row.metricValues ?? [];
      totalUsers += parseInt(metrics[0]?.value ?? "0", 10);
    });

    // Calculate the previous time period (assuming the same duration as the current period)
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const duration = endDateObj.getTime() - startDateObj.getTime();
    const previousEndDateObj = new Date(startDateObj.getTime() - 1);
    const previousStartDateObj = new Date(
      previousEndDateObj.getTime() - duration
    );

    const previousStartDate = previousStartDateObj.toISOString().split("T")[0];
    const previousEndDate = previousEndDateObj.toISOString().split("T")[0];

    // Fetch total users for the previous time period
    const previousUsersResponse = await fetchAnalyticsData(
      previousStartDate,
      previousEndDate,
      [],
      ["totalUsers"]
    );

    let previousTotalUsers = 0;
    previousUsersResponse.rows?.forEach((row) => {
      const metrics = row.metricValues ?? [];
      previousTotalUsers += parseInt(metrics[0]?.value ?? "0", 10);
    });

    // Calculate user increase percentage
    const userIncreasePercentage =
      previousTotalUsers > 0
        ? ((totalUsers - previousTotalUsers) / previousTotalUsers) * 100
        : 0;

    // Fetch total engagement duration and active users
    const engagementResponse = await fetchAnalyticsData(
      formattedStartDate,
      formattedEndDate,
      [],
      ["userEngagementDuration", "activeUsers"]
    );

    let totalEngagementDuration = 0;
    let activeUsers = 0;
    engagementResponse.rows?.forEach((row) => {
      const metrics = row.metricValues ?? [];
      totalEngagementDuration += parseInt(metrics[0]?.value ?? "0", 10); // userEngagementDuration in seconds
      activeUsers += parseInt(metrics[1]?.value ?? "0", 10); // activeUsers
    });

    // Calculate average engagement time per active user
    const avgEngagementTimePerActiveUser =
      totalEngagementDuration / (activeUsers || 1);
    const avgEngagementTimeFormatted = formatDuration(
      avgEngagementTimePerActiveUser
    );

    // Fetch page data
    const pageDataResponse = await fetchAnalyticsData(
      formattedStartDate,
      formattedEndDate,
      ["pageTitle"],
      ["screenPageViews", "userEngagementDuration"]
    );

    const pages =
      pageDataResponse.rows?.map((row) => {
        const dimensions = row.dimensionValues ?? [];
        const metrics = row.metricValues ?? [];

        const pageTitle = dimensions[0]?.value ?? "";
        const pageViews = parseInt(metrics[0]?.value ?? "0", 10);
        const engagementDuration = parseInt(metrics[1]?.value ?? "0", 10);

        return {
          pageName: pageTitle,
          totalViews: pageViews,
          avgTimeSpent: formatDuration(engagementDuration / (pageViews || 1)),
        };
      }) || [];

    // Fetch total users by browser
    const browserDataResponse = await fetchAnalyticsData(
      formattedStartDate,
      formattedEndDate,
      ["browser"],
      ["totalUsers"]
    );

    const browsers =
      browserDataResponse.rows?.map((row) => {
        const dimensions = row.dimensionValues ?? [];
        const metrics = row.metricValues ?? [];

        const browserName = dimensions[0]?.value ?? "";
        const userCount = parseInt(metrics[0]?.value ?? "0", 10);

        return {
          browser: browserName,
          users: userCount,
        };
      }) || [];

    // Fetch total users by country
    const countryDataResponse = await fetchAnalyticsData(
      formattedStartDate,
      formattedEndDate,
      ["country"],
      ["totalUsers"]
    );

    const countries =
      countryDataResponse.rows?.map((row) => {
        const dimensions = row.dimensionValues ?? [];
        const metrics = row.metricValues ?? [];

        const countryName = dimensions[0]?.value ?? "";
        const userCount = parseInt(metrics[0]?.value ?? "0", 10);

        return {
          country: countryName,
          users: userCount,
        };
      }) || [];

    const result = {
      totalUsers,
      userIncreasePercentage: userIncreasePercentage.toFixed(2) + "%",
      avgEngagementTimePerActiveUser: avgEngagementTimeFormatted,
      pages,
      browsers,
      countries,
    };

    res.json(result);
  } catch (err:any) {
    console.error("Error fetching analytics data:", err);
    res.status(500).json({ error: err?.message });
  }
};
