// Components/LeasesCard.tsx
export const LeasesCard = () => (
    <div className="card">
        <div className="card-title">Leases</div>
        <table className="table">
            <thead>
                <tr>
                    <th>Property</th>
                    <th>Unit</th>
                    <th>Tenant</th>
                    <th>Term</th>
                    <th>Ends</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Maple St</td>
                    <td>4D</td>
                    <td>Jamie Lin</td>
                    <td>12 mo</td>
                    <td>Aug 30, 2026</td>
                </tr>
                <tr>
                    <td>Oak Ave</td>
                    <td>1A</td>
                    <td>Chris Yu</td>
                    <td>6 mo</td>
                    <td>Mar 1, 2026</td>
                </tr>
            </tbody>
        </table>
    </div>
);
