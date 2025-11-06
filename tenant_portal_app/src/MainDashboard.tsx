import { ExpenseTrackerCard } from "./components/ui/ExpenseTrackerCard";
import { LeasesCard } from "./components/ui/LeasesCard";
import { MaintenanceCard } from "./components/ui/MaintenanceCard";
import { MessagingCard } from "./components/ui/MessagingCard";
import { RentEstimatorCard } from "./components/ui/RentEstimatorCard";
import { RentalApplicationsCard } from "./components/ui/RentalApplicationsCard";
import { PaymentsCard } from "./components/ui/PaymentsCard";
import { AuditLogCard } from "./components/ui/AuditLogCard";
import { AuthenticationCard } from "./components/ui/AuthenticationCard";
import { TenantViewsCard } from "./components/ui/TenantViewsCard";
import { ProspectiveTenantCard } from "./components/ui/ProspectiveTenantCard";

// Main Dashboard Component
const MainDashboard = () => (
    <div className="grid">
        <MaintenanceCard />
        <PaymentsCard />
        <MessagingCard />
        <LeasesCard />
        <div className="split">
            <RentalApplicationsCard />
            <ExpenseTrackerCard />
        </div>
        <div className="split">
            <RentEstimatorCard />
            <AuditLogCard />
        </div>
        <AuthenticationCard />
        <TenantViewsCard />
        <ProspectiveTenantCard />
    </div>
);

export default MainDashboard;