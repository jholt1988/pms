// Components/RentEstimatorCard.tsx
export const RentEstimatorCard = () => (
    <div className="card">
        <div className="card-title">Rent Estimator</div>
        <div className="form">
            <div className="field">
                <div className="label">Property</div>
                <div className="input">Oak Ave</div>
            </div>
            <div className="field">
                <div className="label">Unit</div>
                <div className="input">2C</div>
            </div>
            <div className="field">
                <div className="label">Bedrooms</div>
                <div className="input">2</div>
            </div>
            <div className="field">
                <div className="label">Bathrooms</div>
                <div className="input">1</div>
            </div>
            <div className="section-actions">
                <div className="btn" data-media-type="banani-button">Estimate</div>
            </div>
            <div className="empty">Estimated Market Rent: $1,475 - $1,620</div>
        </div>
    </div>
);
