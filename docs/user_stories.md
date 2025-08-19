# User Stories Visualization

The following diagram illustrates key user stories and their interactions within the property inspection application.

```mermaid
flowchart TD
    seeker[Property Seeker]
    owner[Property Owner]
    inspector[Inspector]
    listings[Property Listings]
    schedule[Inspection Schedule]

    seeker -->|Browse| listings
    seeker -->|Request Inspection| schedule
    owner -->|List Property| listings
    inspector -->|Manage| schedule
```

The diagram can be rendered using a Mermaid-compatible viewer.

