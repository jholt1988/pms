// Components/MaintenanceCard.tsx
export const MaintenanceCard = () => (
    <div className="card">
        <div className="card-title">Maintenance Requests</div>
        <div className="list">
            <div className="list-row">
                <div><strong>Leaky faucet</strong> • Unit 2B <span className="badge">P1</span></div>
                <div className="section-actions">
                    <span className="status pending">PENDING</span>
                    <div className="btn" data-media-type="banani-button">Assign</div>
                    <div className="btn" data-media-type="banani-button">Update</div>
                </div>
            </div>
            <div className="list-row">
                <div><strong>AC not cooling</strong> • Unit 5A <span className="badge">P2</span></div>
                <div className="section-actions">
                    <span className="status inprogress">IN_PROGRESS</span>
                    <div className="btn" data-media-type="banani-button">Update</div>
                </div>
            </div>
            <div className="list-row">
                <div><strong>Broken window</strong> • Unit 1C <span className="badge">P3</span></div>
                <div className="section-actions">
                    <span className="status completed">COMPLETED</span>
                </div>
            </div>
        </div>
        <div className="helper">Managers: update status. Tenants: submit via Maintenance.</div>
    </div>
);
