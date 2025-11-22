# SubTracker

A visual subscription management app that helps you track and manage your recurring expenses on an interactive calendar.

## Features

- **Visual Calendar**: See all your subscriptions displayed on an interactive calendar
- **Random Color Assignment**: Each subscription gets a unique color automatically
- **Easy Editing**: Edit subscription details inline (name, price, cycle, start date)
- **Color Customization**: Click to change subscription colors
- **Cancellation Tracking**: Mark subscriptions as cancelled while keeping them visible until expiration
- **Monthly Cost Calculator**: See your total monthly expenses excluding cancelled items
- **Import/Export**: Save and load your subscriptions as JSON files
- **Local Storage**: All data persists in your browser

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **react-big-calendar** - Calendar component
- **date-fns** - Date manipulation
- **lucide-react** - Icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Mjons/sub-tracker.git
cd sub-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Usage

### Adding a Subscription

1. Fill in the form on the left sidebar:
   - Service Name (e.g., Netflix)
   - Cost (monthly or yearly price)
   - Start Date (when it begins)
   - Billing Cycle (monthly or yearly)
2. Click "Add Subscription"
3. A random color is assigned automatically

### Editing a Subscription

1. Click the pencil icon on any subscription
2. Edit the name, price, cycle, or start date
3. Click Save or Cancel

### Changing Colors

1. Click the colored circle next to any subscription
2. Select a new color from the palette

### Marking as Cancelled

1. Click the ban icon on any subscription
2. The subscription appears greyed out but remains visible
3. Cancelled subscriptions are excluded from monthly totals
4. Click again to reactivate

### Import/Export

- **Export**: Click the download icon to save all subscriptions as JSON
- **Import**: Click the upload icon to load a previously saved JSON file

## Data Structure

Subscriptions are stored with the following fields:

```json
{
  "id": 1234567890,
  "name": "Netflix",
  "price": 15.99,
  "startDate": "2024-01-15",
  "cycle": "monthly",
  "color": "#EF4444",
  "cancelled": false
}
```

## Future Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and improvements.

## License

MIT License - feel free to use this project however you'd like!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
