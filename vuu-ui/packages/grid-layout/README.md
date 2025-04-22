GridModel operations that create new tracks

1. GridModel.removeGridColumn

calls GridTracks.removeTrack (which fires "grid-track-resize")
fires "child-position-updates"

- useGridSplitterResizing.removeTrack.
  When track resized to zero

- GridLayoutModel.removeGridItem
  When a grid item is removed and only that griditem required this track

2. GridModel.removeGridRow (see removeGridColumn above)

GridTracks.<set>columns
NOT USED

GridTracks.<set>rows
NOT USED

3. GridTracks.splitTrack

fires "grid-track-resize"

- GridLayoutModel.dropSplitGridItem

4. GridTracks.splitTracks

fires "grid-track-resize"

- GridLayoutModel.dropSplitGridItem

5. GridTracks.insertTrack

- GridLayoutModel.addTrackForResize

When GridModel removes a track, it computes updates to child items then applies those updates

When GridLayoutModel applies an operation that creates a
grid track, it computes updates to child items then asks
GridModel to apply each update. Move this logic up into GridModel
GridLayoutModel should not need the addTrack method
