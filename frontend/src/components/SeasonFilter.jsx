import { useEffect, useState } from 'react'
import api from '../api/client'

export default function SeasonFilter({
    value,
    onChange,
    onSeasonSelect,
    includeAll = false
}) {
    const [seasons, setSeasons] = useState([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        const loadSeasons = async () => {
            try {
                setLoading(true)
                setError('')

                const response = await api.get('/seasons')

                console.log('SEASONS API RESPONSE:', response.data)

                // /seasons returns an array directly
                const list = Array.isArray(response.data)
                    ? response.data
                    : response.data?.data || []

                if (!mounted) return

                setSeasons(list)

                // Automatically select current season
                if (!value && list.length > 0) {
                    const current =
                        list.find(
                            (season) =>
                                season.is_current === true ||
                                season.is_current === 1
                        ) || list[0]

                    const currentId = Number(current.id)

                    onChange(currentId)
                    onSeasonSelect?.(current)
                }
            } catch (err) {
                console.error(
                    'SEASONS API ERROR:',
                    err.response?.data || err
                )

                if (!mounted) return

                setSeasons([])
                setError(
                    err.response?.data?.message ||
                    'Unable to load seasons'
                )
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        loadSeasons()

        return () => {
            mounted = false
        }

        // Only load once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleChange = (e) => {
        const id = e.target.value
            ? Number(e.target.value)
            : ''

        onChange(id)

        const selected =
            seasons.find(
                (season) => Number(season.id) === id
            ) || null

        onSeasonSelect?.(selected)
    }

    return (
        <div className="filter-group">
            <label htmlFor="season-filter">
                Season
            </label>

            <select
                id="season-filter"
                className="filter-select"
                value={value ?? ''}
                onChange={handleChange}
                disabled={loading}
            >
                {loading ? (
                    <option value="">
                        Loading seasons...
                    </option>
                ) : (
                    <>
                        {includeAll && (
                            <option value="">
                                All seasons
                            </option>
                        )}

                        {seasons.map((season) => (
                            <option
                                key={season.id}
                                value={season.id}
                            >
                                {season.conference_season ||
                                    `Season ${season.season_year}`}
                            </option>
                        ))}
                    </>
                )}
            </select>

            {error && (
                <div className="filter-error">
                    {error}
                </div>
            )}
        </div>
    )
}