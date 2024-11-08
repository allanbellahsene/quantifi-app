# QuantiFi

In the fast-paced world of quantitative finance, speed and efficiency in strategy development can make all the difference. 

QuantiFi aims to industrialize the entire process of researching systematic trading strategies, enabling traders to:

1. Quickly formulate and test any trading hypothesis
2. Instantly backtest strategies against historical cryptocurrency data
3. Analyze results with advanced performance metrics and visualizations
4. Iterate and refine strategies with unparalleled speed

By streamlining the strategy research workflow, QuantiFi empowers traders to explore a wider range of ideas, identify promising strategies faster, and gain a competitive edge in the market.

## Features

- Intuitive Strategy Builder: Easily create and modify any rule-based trading strategy you can think of.
- Rapid Backtesting Engine: Test your strategies against historical data in seconds, not hours.
- Real-time Performance Metrics: Get instant feedback on your strategy's performance with comprehensive analytics.
- Interactive Visualization Tools: Understand your results at a glance with clear, insightful charts and graphs.
- Iterative Workflow Support: Seamlessly refine and compare multiple strategy versions.

## Technology Stack

- Backend: FastAPI (Python)
- Frontend: React (JavaScript)
- Data Source: Binance API

## Prerequisites

- Python 3.8+
- Node.js 14+
- npm 6+

## Installation

### Backend Setup

1. Clone the repository:
   ```
   git clone https://github.com/allanbellahsene/quantifi-app.git
   cd quantifi-app/backend
   ```

2. Install Python 3 and Required Packages:
   ```
   sudo apt install python3 python3-venv python3-pip -y
   ```

3. Create a virtual environment inside the backend directory:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```
   cd ../frontend
   ```

2. If not already installed, install Node.js and npm:

- Add the NodeSource PPA for the Latest LTS Version:
   ```
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   ```

- Install Node.js and npm:
   ```
   sudo apt install nodejs -y
   ```

- Verify the installation:
   ```
   node -v
   npm -v
   ```

3. Install dependencies:
   ```
   npm install
   ```

### Prototype Setup

1. Navigate to the prototype directory:
   ```
   cd ../prototype
   ```
2. Download Node.js (https://nodejs.org)

3. Install dependencies:
   ```
   npm install recharts lucide-react @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-slot
   ```
4. Install Tailwind and its dependencies:
   ```
   npm install recharts -D tailwindcss postcss autoprefixer
   ```
5. Run the development server:
   ```
   npm start
   ```
6. View the prototype: Open your web browser and navigate to http://localhost:3000.
   
## Running the Application

1. Start the backend server:
   ```
   cd backend
   uvicorn app.main:app --reload --port 8001
   ```

2. In a new terminal, start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Use the strategy builder to create your custom trading strategy.
2. Select an asset and date range for backtesting.
3. Run the backtest and view the results.

## API Documentation

Once the backend is running, you can view the API documentation at `http://localhost:8000/docs`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## Disclaimer

This software is for educational purposes only. Do not use it to make any investment decisions. Always do your own research and understand the risks involved in trading.

## Contact


Project Link: [https://github.com/allanbellahsene/quantifi-app]
