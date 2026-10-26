
import streamlit as st
import pandas as pd
import requests
from pathlib import Path


# =========================================================
# PAGE CONFIGURATION
# =========================================================

st.set_page_config(
    page_title="AgroVision AI",
    page_icon="🌾",
    layout="wide",
    initial_sidebar_state="collapsed"
)


# =========================================================
# THEME
# =========================================================

st.markdown(
    """
    <style>
    .stApp {
        background-color: #06180d;
        color: #f5fff7;
    }

    [data-testid="stMetric"] {
        background-color: #0d2b18;
        border: 1px solid #286b3a;
        padding: 15px;
        border-radius: 12px;
    }

    [data-testid="stMetricLabel"] {
        color: #c1d8c7 !important;
    }

    [data-testid="stMetricValue"] {
        color: #55e477 !important;
    }

    div[data-baseweb="select"] > div {
        background-color: #0d2b18;
    }

    .stButton > button,
    .stDownloadButton > button {
        background-color: #117331;
        color: white;
        border-radius: 8px;
        border: 1px solid #32d45d;
    }

    hr {
        border-color: #286b3a;
    }
    </style>
    """,
    unsafe_allow_html=True
)


# =========================================================
# PROJECT PATHS AND BACKEND
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = PROJECT_ROOT / "data" / "crop_prices.csv"

BACKEND_URL = "http://127.0.0.1:5000"


# =========================================================
# LOAD DATA
# =========================================================

@st.cache_data
def load_data(file_path, modified_time):
    data = pd.read_csv(file_path)

    required_columns = [
        "Date",
        "Crop",
        "State",
        "District",
        "Market",
        "Min_Price",
        "Max_Price",
        "Modal_Price"
    ]

    missing = [
        column
        for column in required_columns
        if column not in data.columns
    ]

    if missing:
        raise ValueError(
            f"Missing dataset columns: {missing}"
        )

    data["Date"] = pd.to_datetime(
        data["Date"],
        errors="coerce"
    )

    for column in ["Crop", "State", "District", "Market"]:
        data[column] = (
            data[column]
            .fillna("")
            .astype(str)
            .str.strip()
        )

    for column in ["Min_Price", "Max_Price", "Modal_Price"]:
        data[column] = pd.to_numeric(
            data[column],
            errors="coerce"
        )

    data = data.dropna(
        subset=[
            "Date",
            "Min_Price",
            "Max_Price",
            "Modal_Price"
        ]
    )

    data = data[
        (data["Crop"] != "")
        & (data["State"] != "")
        & (data["District"] != "")
        & (data["Market"] != "")
    ]

    return (
        data.sort_values("Date")
        .reset_index(drop=True)
    )


if not DATA_FILE.exists():
    st.error(f"Dataset not found: {DATA_FILE}")
    st.stop()

try:
    data = load_data(
        str(DATA_FILE),
        DATA_FILE.stat().st_mtime
    )
except Exception as error:
    st.error(f"Could not load the dataset: {error}")
    st.stop()

if data.empty:
    st.error("The dataset has no valid records.")
    st.stop()


# =========================================================
# AI PREDICTION FUNCTION
# =========================================================

def get_ml_prediction(
    crop,
    state,
    district,
    market,
    prediction_date
):
    try:
        response = requests.post(
            f"{BACKEND_URL}/predict",
            json={
                "crop": crop,
                "state": state,
                "district": district,
                "market": market,
                "date": prediction_date.strftime("%Y-%m-%d")
            },
            timeout=15
        )

        if response.status_code != 200:
            return (
                None,
                f"Backend returned HTTP {response.status_code}."
            )

        result = response.json()
        price = result.get("predicted_modal_price")

        if price is None:
            return (
                None,
                "The backend response did not contain a prediction."
            )

        return float(price), None

    except requests.RequestException:
        return None, "Cannot connect to the prediction backend."

    except (ValueError, TypeError):
        return None, "The backend returned an invalid prediction."


# =========================================================
# HEADER
# =========================================================

header_left, header_right = st.columns([3, 1])

with header_left:
    st.title("🌾 AgroVision AI")
    st.caption("Smart Agricultural Market Intelligence")

with header_right:
    st.markdown("### 📊 Dashboard")
    st.caption("AI-Based Crop Price Prediction")

st.divider()

st.write(
    "Monitor agricultural market prices, explore historical "
    "trends, and view machine-learning price predictions."
)


# =========================================================
# MARKET OVERVIEW
# =========================================================

st.header("📊 Market Overview")

metric1, metric2, metric3, metric4 = st.columns(4)

with metric1:
    st.metric(
        "🏪 Total Markets",
        f"{data['Market'].nunique():,}"
    )

with metric2:
    st.metric(
        "🗺️ States Covered",
        f"{data['State'].nunique():,}"
    )

with metric3:
    st.metric(
        "🌱 Commodities",
        f"{data['Crop'].nunique():,}"
    )

with metric4:
    st.metric(
        "📋 Price Records",
        f"{len(data):,}"
    )

metric5, metric6, metric7, metric8 = st.columns(4)

with metric5:
    st.metric(
        "💰 Average Modal Price",
        f"₹{data['Modal_Price'].mean():,.0f}"
    )

with metric6:
    st.metric(
        "⬆️ Highest Price",
        f"₹{data['Max_Price'].max():,.0f}"
    )

with metric7:
    st.metric(
        "⬇️ Lowest Price",
        f"₹{data['Min_Price'].min():,.0f}"
    )

with metric8:
    st.metric(
        "📅 Latest Data",
        data["Date"].max().strftime("%d-%m-%Y")
    )


# =========================================================
# MARKET FILTERS
# =========================================================

st.header("🔎 Select Your Market")

filter1, filter2, filter3, filter4 = st.columns(4)

with filter1:
    states = sorted(data["State"].unique())
    selected_state = st.selectbox("State", states)

state_data = data[
    data["State"] == selected_state
]

with filter2:
    crops = sorted(state_data["Crop"].unique())
    selected_crop = st.selectbox("Crop", crops)

crop_data = state_data[
    state_data["Crop"] == selected_crop
]

with filter3:
    districts = sorted(crop_data["District"].unique())
    selected_district = st.selectbox(
        "District",
        districts
    )

district_data = crop_data[
    crop_data["District"] == selected_district
]

with filter4:
    markets = sorted(district_data["Market"].unique())
    selected_market = st.selectbox(
        "Market",
        markets
    )

filtered_data = data[
    (data["State"] == selected_state)
    & (data["Crop"] == selected_crop)
    & (data["District"] == selected_district)
    & (data["Market"] == selected_market)
].sort_values("Date").copy()

if filtered_data.empty:
    st.warning(
        "No data is available for this market selection."
    )
    st.stop()

latest_record = filtered_data.iloc[-1]
latest_price = float(latest_record["Modal_Price"])

st.info(
    f"📍 **{selected_market}** | "
    f"🌱 {selected_crop} | "
    f"🏙️ {selected_district} | "
    f"🗺️ {selected_state}"
)


# =========================================================
# SELECTED MARKET PRICES
# =========================================================

st.header("💰 Latest Market Prices")

price1, price2, price3 = st.columns(3)

with price1:
    st.metric(
        "Latest Modal Price",
        f"₹{latest_price:,.0f}",
        help="The modal price in the latest available dataset record."
    )

with price2:
    st.metric(
        "Minimum Price",
        f"₹{latest_record['Min_Price']:,.0f}"
    )

with price3:
    st.metric(
        "Maximum Price",
        f"₹{latest_record['Max_Price']:,.0f}"
    )

st.caption(
    "Latest available record date: "
    f"{latest_record['Date'].strftime('%d-%m-%Y')}"
)


# =========================================================
# HISTORICAL PRICE CHART
# Uses Streamlit's native line chart
# =========================================================

st.header("📈 Historical Price Trend")

historical_data = (
    filtered_data[["Date", "Modal_Price"]]
    .dropna()
    .sort_values("Date")
    .set_index("Date")
)

if historical_data.empty:
    st.warning("No historical prices are available.")
else:
    st.line_chart(
        historical_data,
        y="Modal_Price",
        height=350
    )

    st.caption(
        f"Showing {len(historical_data)} historical price records."
    )


# =========================================================
# TOP COMMODITIES AND STATES
# Uses Streamlit's native bar charts
# =========================================================

chart1, chart2 = st.columns(2)

with chart1:
    st.subheader("🌱 Top Commodities by Average Price")

    crop_prices = (
        data.groupby("Crop", as_index=False)["Modal_Price"]
        .mean()
        .rename(
            columns={"Modal_Price": "Average Modal Price"}
        )
        .sort_values(
            "Average Modal Price",
            ascending=False
        )
        .head(10)
        .sort_values("Average Modal Price")
    )

    if crop_prices.empty:
        st.warning("No commodity price data is available.")
    else:
        st.bar_chart(
            crop_prices,
            x="Crop",
            y="Average Modal Price",
            height=350
        )

with chart2:
    st.subheader("🗺️ States by Average Price")

    state_prices = (
        data.groupby("State", as_index=False)["Modal_Price"]
        .mean()
        .rename(
            columns={"Modal_Price": "Average Modal Price"}
        )
        .sort_values(
            "Average Modal Price",
            ascending=False
        )
        .head(10)
        .sort_values("Average Modal Price")
    )

    if state_prices.empty:
        st.warning("No state price data is available.")
    else:
        st.bar_chart(
            state_prices,
            x="State",
            y="Average Modal Price",
            height=350
        )


# =========================================================
# AI PRICE PREDICTION
# =========================================================

st.header("🤖 AI Price Prediction")

prediction_date = (
    filtered_data["Date"].max()
    + pd.Timedelta(days=1)
)

st.write(
    "Prediction date: "
    f"**{prediction_date.strftime('%d-%m-%Y')}**"
)

with st.spinner("Contacting the ML prediction backend..."):
    predicted_price, prediction_error = get_ml_prediction(
        selected_crop,
        selected_state,
        selected_district,
        selected_market,
        prediction_date
    )

if predicted_price is None:
    st.warning(
        f"{prediction_error} The dashboard will show the latest "
        "market price as a fallback, not as an AI prediction."
    )

    predicted_price = latest_price
    prediction_is_real = False
else:
    prediction_is_real = True

if latest_price != 0:
    percentage_change = (
        (predicted_price - latest_price) / latest_price
    ) * 100
else:
    percentage_change = 0.0

with st.container(border=True):
    st.subheader("Predicted Modal Price")

    prediction_col1, prediction_col2 = st.columns(2)

    with prediction_col1:
        st.metric(
            f"Price for {prediction_date.strftime('%d-%m-%Y')}",
            f"₹{predicted_price:,.0f}"
        )

    with prediction_col2:
        st.metric(
            "Expected Change",
            f"{percentage_change:+.2f}%",
            delta=f"{percentage_change:+.2f}%"
        )

    if not prediction_is_real:
        st.caption(
            "Fallback value shown because the backend prediction "
            "was unavailable."
        )


# =========================================================
# MARKET INDICATION
# =========================================================

st.subheader("📌 Price Comparison")

if not prediction_is_real:
    recommendation = "Prediction unavailable"

    st.info(
        "Start the Flask backend and check the prediction endpoint "
        "before relying on a market indication."
    )

elif predicted_price > latest_price:
    recommendation = "Price predicted to increase"

    st.success(
        "The model predicts a price higher than the latest "
        "recorded price."
    )

elif predicted_price < latest_price:
    recommendation = "Price predicted to decrease"

    st.warning(
        "The model predicts a price lower than the latest "
        "recorded price."
    )

else:
    recommendation = "Predicted price unchanged"

    st.info(
        "The predicted price is approximately the same as the "
        "latest recorded price."
    )

st.caption(
    "This is a model-based estimate, not a guaranteed market "
    "outcome or personalized selling advice."
)


# =========================================================
# RECENT MARKET PRICES
# =========================================================

st.header("📋 Recent Market Prices")

st.caption(
    f"Latest records for {selected_crop} at {selected_market}"
)

recent_data = filtered_data.tail(10).copy()

recent_data["Date"] = (
    recent_data["Date"].dt.strftime("%d-%m-%Y")
)

recent_data = recent_data[
    [
        "Date",
        "Crop",
        "Market",
        "Min_Price",
        "Modal_Price",
        "Max_Price"
    ]
].rename(
    columns={
        "Min_Price": "Min Price (₹)",
        "Modal_Price": "Modal Price (₹)",
        "Max_Price": "Max Price (₹)"
    }
)

st.dataframe(
    recent_data,
    use_container_width=True,
    hide_index=True,
    column_config={
        "Date": st.column_config.TextColumn("📅 Date"),
        "Crop": st.column_config.TextColumn("🌱 Crop"),
        "Market": st.column_config.TextColumn("🏪 Market"),
        "Min Price (₹)": st.column_config.NumberColumn(
            "Min Price (₹)",
            format="₹%.0f"
        ),
        "Modal Price (₹)": st.column_config.NumberColumn(
            "Modal Price (₹)",
            format="₹%.0f"
        ),
        "Max Price (₹)": st.column_config.NumberColumn(
            "Max Price (₹)",
            format="₹%.0f"
        )
    },
    height=400
)


# =========================================================
# DOWNLOAD MARKET DATA
# =========================================================

st.header("📥 Export Market Data")

export_data = filtered_data.copy()

export_data["Date"] = (
    export_data["Date"].dt.strftime("%Y-%m-%d")
)

st.download_button(
    label="⬇️ Download Market Prices CSV",
    data=export_data.to_csv(index=False).encode("utf-8"),
    file_name="agrovision_market_prices.csv",
    mime="text/csv"
)


# =========================================================
# AGROVISION ASSISTANT
# =========================================================

st.header("🤖 AgroVision Assistant")

assistant1, assistant2, assistant3 = st.columns(3)

with assistant1:
    with st.container(border=True):
        st.subheader("💰 Current Crop Price")

        st.metric(
            "Latest Modal Price",
            f"₹{latest_price:,.0f}"
        )

        st.write(
            f"{selected_crop} at {selected_market}, "
            f"{selected_district}."
        )

with assistant2:
    with st.container(border=True):
        st.subheader("🤖 Price Prediction")

        st.metric(
            "Predicted Price",
            f"₹{predicted_price:,.0f}"
        )

        st.write(
            "Prediction date: "
            f"{prediction_date.strftime('%d-%m-%Y')}"
        )

with assistant3:
    with st.container(border=True):
        st.subheader("📊 Market Analysis")

        st.metric(
            "Expected Change",
            f"{percentage_change:+.2f}%"
        )

        st.write(recommendation)


# =========================================================
# FOOTER
# =========================================================

st.divider()

st.markdown("### 🌾 AgroVision AI")

st.caption("AI-Based Crop Price Prediction System")

st.caption(
    "Smart Agricultural Market Intelligence • "
    "Project Prototype • 2026"
)

