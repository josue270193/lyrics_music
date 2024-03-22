interface Player {
    item: TrackObject | null,
}

interface TrackObject {
    album: {
        name: string
    },
    artists: ArtistObject[],
    name: string
}

interface ArtistObject {
    name: string
}
