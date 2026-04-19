from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_visitors_today: int
    active_visitors: int
    pending_approvals: int
    overstayed_visitors: int