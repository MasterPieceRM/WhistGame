'use client';

const AVATAR_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#e84393', '#00b894', '#6c5ce7',
];

function getColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function getInitials(name) {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * EntityAvatar
 * Renders a circular photo or initials avatar for a player or team.
 * Teams show two overlapping avatars.
 */
export default function EntityAvatar({ entity, size = 64 }) {
    const player = entity?.players?.[0];
    if (!player) return null;

    const base = {
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        display: 'block',
    };

    const placeholder = (p) => ({
        ...base,
        background: getColor(p.name),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: Math.round(size * 0.35),
        color: '#fff',
    });

    function Single({ p }) {
        if (p.photo) return <img src={p.photo} alt={p.name} style={base} />;
        return <div style={placeholder(p)}>{getInitials(p.name)}</div>;
    }

    if (entity.type === 'team' && entity.players.length >= 2) {
        const p2 = entity.players[1];
        const gap = Math.round(size * 0.12);
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap, flexShrink: 0 }}>
                <Single p={player} />
                <Single p={p2} />
            </div>
        );
    }

    return <Single p={player} />;
}
