// Історичні дані через Ergast-compatible API (Jolpica)
const Historical = {
    // Отримати історичну турнірну таблицю
    async getStandings(year) {
        try {
            const response = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`);
            const data = await response.json();
            const standings = data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];

            return standings.map(s => ({
                position: parseInt(s.position, 10),
                points: parseFloat(s.points),
                wins: parseInt(s.wins, 10),
                driver: {
                    firstName: s.Driver.givenName,
                    lastName: s.Driver.familyName,
                    code: s.Driver.code,
                    number: s.Driver.permanentNumber,
                    nationality: s.Driver.nationality,
                    driverId: s.Driver.driverId
                },
                team: {
                    name: s.Constructors[0]?.name || 'Unknown',
                    constructorId: s.Constructors[0]?.constructorId,
                    nationality: s.Constructors[0]?.nationality
                }
            }));
        } catch (err) {
            return [];
        }
    },

    // Отримати календар сезону
    async getRaces(year) {
        try {
            const response = await fetch(`https://api.jolpi.ca/ergast/f1/${year}.json`);
            const data = await response.json();
            const races = data.MRData.RaceTable.Races || [];

            return races.map(r => ({
                round: r.round,
                raceName: r.raceName,
                date: r.date,
                circuit: r.Circuit?.circuitName || '',
                country: r.Circuit?.Location?.country || ''
            }));
        } catch (err) {
            return [];
        }
    },

    formatDate(dateStr) {
        try {
            return new Date(dateStr).toLocaleDateString('uk-UA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateStr || '';
        }
    }
};