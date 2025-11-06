// Components/MessagingCard.tsx
export const MessagingCard = () => (
    <div className="card">
        <div className="card-title">Messaging</div>
        <div className="messages">
            <div className="message">
                <div className="avatar">
                    <img src="https://app.banani.co/avatar1.jpeg" alt="Alex tenant profile photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="bubble"><strong>Alex (Tenant):</strong> The hallway light is out on 3rd floor.</div>
            </div>
            <div className="message">
                <div className="avatar">
                    <img src="https://app.banani.co/avatar2.jpg" alt="Morgan property manager profile photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="bubble"><strong>Morgan (Manager):</strong> Thanks, we'll send maintenance today.</div>
            </div>
        </div>
        <div className="helper">Shared interface for tenants and property managers.</div>
    </div>
);
