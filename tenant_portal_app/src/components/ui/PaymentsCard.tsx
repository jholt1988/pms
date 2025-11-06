// Components/PaymentsCard.tsx
export const PaymentsCard = () => (
    <div className="card">
        <div className="card-title">Payments</div>
        <table className="table">
            <thead>
                <tr>
                    <th>Invoice</th>
                    <th>Unit</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>#INV-1043</td>
                    <td>3C</td>
                    <td>$1,250</td>
                    <td><span className="pill">Unpaid</span></td>
                    <td>Nov 5</td>
                </tr>
                <tr>
                    <td>#INV-1042</td>
                    <td>2B</td>
                    <td>$1,150</td>
                    <td><span className="pill">Paid</span></td>
                    <td>Oct 5</td>
                </tr>
            </tbody>
        </table>
        <div className="helper">Tenants can view invoices and payment history.</div>
    </div>
);
