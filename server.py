import os
import json
import uuid
import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="TraceHarvest AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = os.path.join(os.path.dirname(__file__), "traceharvest_db.json")

def get_initial_seed_data():
    now_iso = datetime.datetime.now().isoformat()
    return {
        "users": [
            {
                "id": "u-farmer-01",
                "email": "farmer@traceharvest.ai",
                "name": "Ramesh Naidu",
                "role": "Farmer",
                "organization": "Sri Krishna Agri Farms",
                "location": "Tenali, Guntur District, AP",
                "avatar": "👨‍🌾",
                "phone": "+91 98480 12345",
                "credibilityScore": 96
            },
            {
                "id": "u-transporter-01",
                "email": "transporter@traceharvest.ai",
                "name": "K. Jagan Mohan",
                "role": "Transporter",
                "organization": "FastTrack ColdTrans AP",
                "location": "Vijayawada Logistics Hub, AP",
                "avatar": "🚚",
                "phone": "+91 94401 54321",
                "credibilityScore": 92
            },
            {
                "id": "u-warehouse-01",
                "email": "warehouse@traceharvest.ai",
                "name": "S. K. Verma",
                "role": "Warehouse Manager",
                "organization": "Guntur Central Cold Hub",
                "location": "Industrial Corridor, Guntur, AP",
                "avatar": "🏬",
                "phone": "+91 86322 89900",
                "credibilityScore": 95
            },
            {
                "id": "u-retailer-01",
                "email": "retailer@traceharvest.ai",
                "name": "Priya Rao",
                "role": "Retailer",
                "organization": "Rythu Bazaar Superstore",
                "location": "Benz Circle, Vijayawada, AP",
                "avatar": "🛒",
                "phone": "+91 86624 77123",
                "credibilityScore": 98
            },
            {
                "id": "u-admin-01",
                "email": "admin@traceharvest.ai",
                "name": "Dr. Aruna Reddy",
                "role": "Food Safety Admin",
                "organization": "Andhra Food Safety Authority (FSSAI Cell)",
                "location": "Mangalagiri HQ, Guntur District, AP",
                "avatar": "🛡️",
                "phone": "+91 86452 33445",
                "credibilityScore": 100
            },
            {
                "id": "u-consumer-01",
                "email": "consumer@traceharvest.ai",
                "name": "Aditi Sharma",
                "role": "Consumer",
                "organization": "Citizen Buyer & Health Advocate",
                "location": "Visakhapatnam, AP",
                "avatar": "👩‍💼",
                "phone": "+91 89125 99881",
                "credibilityScore": 100
            }
        ],
        "farms": [
            {
                "id": "FARM-AP-101",
                "name": "Sri Krishna Agri Farms",
                "owner": "Ramesh Naidu",
                "region": "Tenali, Guntur District, Andhra Pradesh",
                "coordinates": "16.2437° N, 80.6400° E",
                "areaAcres": 45,
                "crops": ["Roma Tomatoes", "Guntur Sannam Chillies"],
                "certifications": ["AP Organic Board (APEDA/2024)", "IndGAP Level 2"],
                "soilHealthScore": "89/100 (Optimal Nitrogen, Alkaline pH 6.8)"
            },
            {
                "id": "FARM-AP-102",
                "name": "Rayalaseema Orchards",
                "owner": "Lakshmi Devi",
                "region": "Bangarupalem, Chittoor District, Andhra Pradesh",
                "coordinates": "13.2172° N, 79.1007° E",
                "areaAcres": 65,
                "crops": ["Robusta Cavendish Bananas", "Totapuri Mangoes"],
                "certifications": ["GlobalGAP Certified", "Rainforest Alliance"],
                "soilHealthScore": "92/100 (Rich Red Loamy)"
            },
            {
                "id": "FARM-AP-103",
                "name": "Godavari Greens Organics",
                "owner": "Venkat Rao",
                "region": "Eluru, West Godavari District, Andhra Pradesh",
                "coordinates": "16.7107° N, 81.0952° E",
                "areaAcres": 38,
                "crops": ["Taiwan Pink Guavas", "Papaya"],
                "certifications": ["Jaivik Bharat PGS-India", "AP AgTech Trust Certified"],
                "soilHealthScore": "88/100 (Alluvial Delta Soil)"
            },
            {
                "id": "FARM-AP-104",
                "name": "Tungabhadra Agro Collective",
                "owner": "Siva Kumar Reddy",
                "region": "Adoni, Kurnool District, Andhra Pradesh",
                "coordinates": "15.6322° N, 77.2750° E",
                "areaAcres": 50,
                "crops": ["Organic Palak (Spinach)", "Methi (Fenugreek)"],
                "certifications": ["Under Audit Renewal (Exp. 2026-09)"],
                "soilHealthScore": "78/100 (Semi-Arid Black Cotton)"
            },
            {
                "id": "FARM-AP-105",
                "name": "Krishna Valley Farms",
                "owner": "Anji Babu",
                "region": "Nuzvid / Vijayawada Rural, Krishna District, AP",
                "coordinates": "16.7850° N, 80.8466° E",
                "areaAcres": 80,
                "crops": ["Banganapalle Mangoes (GI Tagged)", "Sweet Lime"],
                "certifications": ["GI Tag Holder #AP-MNG-402", "IndGAP"],
                "soilHealthScore": "94/100 (Sandy Loam)"
            }
        ],
        "batches": [
            {
                "id": "TH-TOM-2026-081",
                "crop": "Roma Tomatoes",
                "variety": "Hybrid S-22 Premium",
                "farmId": "FARM-AP-101",
                "farmName": "Sri Krishna Agri Farms",
                "region": "Tenali, Guntur, AP",
                "harvestDate": "2026-10-18T06:30:00",
                "quantityKg": 2400,
                "currentQuantityKg": 2400,
                "status": "In Transit / Retail",
                "recallStatus": "CLEAR",
                "riskLevel": "Low",
                "dataCompleteness": 100,
                "qrPayload": "https://traceharvest.ai/verify/TH-TOM-2026-081",
                "currentHolder": "Rythu Bazaar Superstore, Vijayawada",
                "notes": "Grade A harvest, washed with ozone water treatment, crates RFID tagged.",
                "timelineEvents": [
                    {
                        "id": "EV-081-1",
                        "type": "HARVEST",
                        "timestamp": "2026-10-18T06:30:00",
                        "actor": "Ramesh Naidu (Farmer)",
                        "location": "Sri Krishna Agri Farms, Tenali, Guntur",
                        "details": "Harvested 2400 kg at 24°C ambient morning temperature.",
                        "verified": True
                    },
                    {
                        "id": "EV-081-2",
                        "type": "INSPECTION",
                        "timestamp": "2026-10-18T09:15:00",
                        "actor": "Guntur Agri Quality Lab",
                        "location": "Tenali Farm Collection Centre",
                        "details": "PASSED: Grade A, Brix 5.2, Pesticide Residue: Below Detectable Limits (ND).",
                        "verified": True,
                        "docRef": "LAB-GT-2026-8812"
                    },
                    {
                        "id": "EV-081-3",
                        "type": "TRANSFER_DISPATCH",
                        "timestamp": "2026-10-18T11:00:00",
                        "actor": "FastTrack ColdTrans AP",
                        "location": "Tenali -> Guntur Central Cold Hub",
                        "details": "Dispatched 2400 kg via Reefer Van AP-07-TJ-4421 at 8.0°C setpoint.",
                        "verified": True
                    },
                    {
                        "id": "EV-081-4",
                        "type": "TRANSFER_RECEIPT",
                        "timestamp": "2026-10-18T13:40:00",
                        "actor": "S. K. Verma (Guntur Central Hub)",
                        "location": "Guntur Central Cold Hub",
                        "details": "Received 2400 kg in Cold Room #3 at 7.5°C, 90% RH.",
                        "verified": True
                    },
                    {
                        "id": "EV-081-5",
                        "type": "TRANSFER_DISPATCH",
                        "timestamp": "2026-10-19T07:00:00",
                        "actor": "FastTrack ColdTrans AP",
                        "location": "Guntur Hub -> Rythu Bazaar Vijayawada",
                        "details": "Dispatched 2400 kg for morning retail distribution.",
                        "verified": True
                    },
                    {
                        "id": "EV-081-6",
                        "type": "RETAIL_RECEIPT",
                        "timestamp": "2026-10-19T09:20:00",
                        "actor": "Priya Rao (Rythu Bazaar)",
                        "location": "Benz Circle, Vijayawada",
                        "details": "Received on retail floor. Scannable consumer QR enabled.",
                        "verified": True
                    }
                ]
            },
            {
                "id": "TH-MNG-2026-042",
                "crop": "Banganapalle Mangoes",
                "variety": "GI Tagged Andhra Gold",
                "farmId": "FARM-AP-105",
                "farmName": "Krishna Valley Farms",
                "region": "Nuzvid, Krishna, AP",
                "harvestDate": "2026-10-19T08:00:00",
                "quantityKg": 1800,
                "currentQuantityKg": 1800,
                "status": "At Distribution Hub",
                "recallStatus": "CLEAR",
                "riskLevel": "Medium",
                "dataCompleteness": 72,
                "qrPayload": "https://traceharvest.ai/verify/TH-MNG-2026-042",
                "currentHolder": "Rayalaseema Agro Depot, Tirupati",
                "notes": "GI Tag batch. Pre-shipment laboratory quality certificate is MISSING from record.",
                "timelineEvents": [
                    {
                        "id": "EV-042-1",
                        "type": "HARVEST",
                        "timestamp": "2026-10-19T08:00:00",
                        "actor": "Anji Babu (Farmer)",
                        "location": "Krishna Valley Farms, Nuzvid",
                        "details": "Harvested 1800 kg export quality GI mangoes.",
                        "verified": True
                    },
                    {
                        "id": "EV-042-2",
                        "type": "TRANSFER_DISPATCH",
                        "timestamp": "2026-10-19T14:30:00",
                        "actor": "Coastal Agri Haulers",
                        "location": "Nuzvid -> Rayalaseema Agro Depot",
                        "details": "Dispatched 1800 kg without attaching mandatory pre-dispatch lab test.",
                        "verified": False
                    },
                    {
                        "id": "EV-042-3",
                        "type": "TRANSFER_RECEIPT",
                        "timestamp": "2026-10-20T04:10:00",
                        "actor": "Depot Supervisor (Tirupati)",
                        "location": "Rayalaseema Agro Depot, Tirupati",
                        "details": "Received 1800 kg into Ripening Chamber 2.",
                        "verified": True
                    }
                ]
            },
            {
                "id": "TH-PLK-2026-019",
                "crop": "Organic Palak (Spinach)",
                "variety": "Broadleaf Green",
                "farmId": "FARM-AP-104",
                "farmName": "Tungabhadra Agro Collective",
                "region": "Adoni, Kurnool, AP",
                "harvestDate": "2026-10-20T05:00:00",
                "quantityKg": 1200,
                "currentQuantityKg": 1200,
                "status": "RECALLED - QUARANTINED",
                "recallStatus": "RECALLED",
                "riskLevel": "Critical",
                "dataCompleteness": 88,
                "qrPayload": "https://traceharvest.ai/verify/TH-PLK-2026-019",
                "currentHolder": "Multiple Downstream Quarantined Points",
                "notes": "URGENT FSSAI RECALL: Contamination flagged by Regional Food Safety Testing Lab.",
                "timelineEvents": [
                    {
                        "id": "EV-019-1",
                        "type": "HARVEST",
                        "timestamp": "2026-10-20T05:00:00",
                        "actor": "Siva Kumar Reddy (Farmer)",
                        "location": "Tungabhadra Agro Collective, Adoni",
                        "details": "Harvested 1200 kg certified organic leafy greens.",
                        "verified": True
                    },
                    {
                        "id": "EV-019-2",
                        "type": "TRANSFER_DISPATCH",
                        "timestamp": "2026-10-20T08:00:00",
                        "actor": "Deccan Express Logistics",
                        "location": "Adoni -> Guntur Central Cold Hub",
                        "details": "Dispatched 1200 kg palletized greens.",
                        "verified": True
                    },
                    {
                        "id": "EV-019-3",
                        "type": "TRANSFER_RECEIPT",
                        "timestamp": "2026-10-20T16:30:00",
                        "actor": "S. K. Verma",
                        "location": "Guntur Central Cold Hub",
                        "details": "Received 1200 kg in sorting line.",
                        "verified": True
                    },
                    {
                        "id": "EV-019-4",
                        "type": "INSPECTION_FAILED",
                        "timestamp": "2026-10-22T10:00:00",
                        "actor": "AP Food Safety Analytical Lab",
                        "location": "Guntur Testing Lab",
                        "details": "CRITICAL FAILURE: Organophosphate pesticide residue detected at 0.42 mg/kg (MRL 0.05 mg/kg).",
                        "verified": True,
                        "docRef": "FSSAI-AP-RECALL-901"
                    },
                    {
                        "id": "EV-019-5",
                        "type": "RECALL_ISSUED",
                        "timestamp": "2026-10-22T11:30:00",
                        "actor": "Dr. Aruna Reddy (Food Safety Admin)",
                        "location": "Mangalagiri HQ",
                        "details": "Level 1 Mandatory Recall enacted. All movement locked. 4 downstream points notified.",
                        "verified": True
                    }
                ]
            },
            {
                "id": "TH-CHI-2026-067",
                "crop": "Guntur Sannam Chillies",
                "variety": "S4 Hot Red Special",
                "farmId": "FARM-AP-101",
                "farmName": "Sri Krishna Agri Farms",
                "region": "Tenali, Guntur, AP",
                "harvestDate": "2026-10-21T14:00:00",
                "quantityKg": 3500,
                "currentQuantityKg": 3500,
                "status": "Flagged - Audit Review",
                "recallStatus": "CLEAR",
                "riskLevel": "High",
                "dataCompleteness": 65,
                "qrPayload": "https://traceharvest.ai/verify/TH-CHI-2026-067",
                "currentHolder": "Guntur Central Cold Hub",
                "notes": "TEMPORAL INCONSISTENCY: Transfer dispatch recorded at 09:30 AM before recorded harvest at 02:00 PM.",
                "timelineEvents": [
                    {
                        "id": "EV-067-1",
                        "type": "TRANSFER_DISPATCH",
                        "timestamp": "2026-10-21T09:30:00",
                        "actor": "FastTrack ColdTrans AP",
                        "location": "Tenali -> Guntur Hub",
                        "details": "Dispatched 3500 kg chillies. Timestamp precedes recorded harvest!",
                        "verified": False
                    },
                    {
                        "id": "EV-067-2",
                        "type": "HARVEST",
                        "timestamp": "2026-10-21T14:00:00",
                        "actor": "Ramesh Naidu",
                        "location": "Tenali Farm Plot 4",
                        "details": "Logged harvest completion for 3500 kg chillies.",
                        "verified": True
                    }
                ]
            },
            {
                "id": "TH-BNN-2026-112",
                "crop": "Robusta Cavendish Bananas",
                "variety": "Export Grade Grand Naine",
                "farmId": "FARM-AP-102",
                "farmName": "Rayalaseema Orchards",
                "region": "Chittoor, AP",
                "harvestDate": "2026-10-17T07:00:00",
                "quantityKg": 5000,
                "currentQuantityKg": 5450,
                "status": "Flagged - Discrepancy",
                "recallStatus": "CLEAR",
                "riskLevel": "High",
                "dataCompleteness": 80,
                "qrPayload": "https://traceharvest.ai/verify/TH-BNN-2026-112",
                "currentHolder": "Rayalaseema Agro Depot",
                "notes": "QUANTITY INFLATION: Dispatched 5000 kg, but receiver logged 5450 kg (+450 kg phantom weight).",
                "timelineEvents": [
                    {
                        "id": "EV-112-1",
                        "type": "HARVEST",
                        "timestamp": "2026-10-17T07:00:00",
                        "actor": "Lakshmi Devi",
                        "location": "Chittoor Orchards",
                        "details": "Harvested 5000 kg bananas.",
                        "verified": True
                    },
                    {
                        "id": "EV-112-2",
                        "type": "TRANSFER_DISPATCH",
                        "timestamp": "2026-10-17T11:00:00",
                        "actor": "Coastal Agri Haulers",
                        "location": "Chittoor -> Tirupati Depot",
                        "details": "Dispatched 5000 kg under Consignment Note AP-CH-991.",
                        "verified": True
                    },
                    {
                        "id": "EV-112-3",
                        "type": "TRANSFER_RECEIPT",
                        "timestamp": "2026-10-17T17:30:00",
                        "actor": "Weighbridge Operator (Tirupati)",
                        "location": "Rayalaseema Agro Depot",
                        "details": "Recorded inbound weighment of 5450 kg (+9% unexplained surplus).",
                        "verified": False
                    }
                ]
            },
            {
                "id": "TH-GVA-2026-095",
                "crop": "Taiwan Pink Guavas",
                "variety": "Crisp Sweet Selection",
                "farmId": "FARM-AP-103",
                "farmName": "Godavari Greens Organics",
                "region": "Eluru, West Godavari, AP",
                "harvestDate": "2026-10-21T06:00:00",
                "quantityKg": 1600,
                "currentQuantityKg": 1600,
                "status": "Cold Chain Excursion",
                "recallStatus": "CLEAR",
                "riskLevel": "Critical",
                "dataCompleteness": 95,
                "qrPayload": "https://traceharvest.ai/verify/TH-GVA-2026-095",
                "currentHolder": "Vijayawada Mega Agripark",
                "notes": "COLD CHAIN ALERT: Temperature sensor logged 18.5°C for 4.2 hours during transit on NH-16 (Upper limit 8°C).",
                "timelineEvents": [
                    {
                        "id": "EV-095-1",
                        "type": "HARVEST",
                        "timestamp": "2026-10-21T06:00:00",
                        "actor": "Venkat Rao",
                        "location": "Godavari Greens, Eluru",
                        "details": "Harvested 1600 kg fresh pink guavas at 22°C.",
                        "verified": True
                    },
                    {
                        "id": "EV-095-2",
                        "type": "INSPECTION",
                        "timestamp": "2026-10-21T08:00:00",
                        "actor": "Eluru Agri Field Chemist",
                        "location": "Eluru Packing Centre",
                        "details": "PASSED: Total Soluble Solids 10.4%, Firmness 7.8 kg/cm2, Zero fruit fly infestation.",
                        "verified": True,
                        "docRef": "EL-Q-2026-441"
                    },
                    {
                        "id": "EV-095-3",
                        "type": "TRANSFER_DISPATCH",
                        "timestamp": "2026-10-21T09:45:00",
                        "actor": "FastTrack ColdTrans AP",
                        "location": "Eluru -> Vijayawada Agripark",
                        "details": "Loaded into Reefer AP-07-TJ-4421. Sensor IoT-TMP-409 attached.",
                        "verified": True
                    },
                    {
                        "id": "EV-095-4",
                        "type": "COLD_CHAIN_EXCURSION",
                        "timestamp": "2026-10-21T12:15:00",
                        "actor": "IoT Automated Telemetry",
                        "location": "NH-16 Corridor (Between Hanuman Junction & Vijayawada)",
                        "details": "Reefer compressor failure. Cabin temp spiked to 18.5°C for 4 hrs 12 mins.",
                        "verified": True,
                        "docRef": "IOT-EXC-2026-095"
                    },
                    {
                        "id": "EV-095-5",
                        "type": "TRANSFER_RECEIPT",
                        "timestamp": "2026-10-21T16:00:00",
                        "actor": "Vijayawada Mega Agripark Receiving",
                        "location": "Vijayawada Agripark Cold Bay 4",
                        "details": "Received 1600 kg. Excursion alert flagged on intake scan.",
                        "verified": True
                    }
                ]
            }
        ],
        "transfers": [
            {
                "id": "TR-2026-501",
                "batchId": "TH-TOM-2026-081",
                "fromLocation": "Sri Krishna Agri Farms, Tenali",
                "toLocation": "Guntur Central Cold Hub",
                "dispatchedQuantityKg": 2400,
                "receivedQuantityKg": 2400,
                "transporter": "FastTrack ColdTrans AP",
                "vehicleNo": "AP-07-TJ-4421",
                "dispatchTime": "2026-10-18T11:00:00",
                "receivedTime": "2026-10-18T13:40:00",
                "status": "Completed",
                "condition": "Temperature controlled 8.0°C",
                "notes": "Delivered on schedule with intact tamper seals."
            },
            {
                "id": "TR-2026-502",
                "batchId": "TH-TOM-2026-081",
                "fromLocation": "Guntur Central Cold Hub",
                "toLocation": "Rythu Bazaar Superstore, Benz Circle",
                "dispatchedQuantityKg": 2400,
                "receivedQuantityKg": 2400,
                "transporter": "FastTrack ColdTrans AP",
                "vehicleNo": "AP-07-TJ-4421",
                "dispatchTime": "2026-10-19T07:00:00",
                "receivedTime": "2026-10-19T09:20:00",
                "status": "Completed",
                "condition": "Chilled 7.5°C",
                "notes": "Final retail delivery."
            },
            {
                "id": "TR-2026-503",
                "batchId": "TH-PLK-2026-019",
                "fromLocation": "Tungabhadra Agro Collective, Adoni",
                "toLocation": "Guntur Central Cold Hub",
                "dispatchedQuantityKg": 1200,
                "receivedQuantityKg": 1200,
                "transporter": "Deccan Express Logistics",
                "vehicleNo": "AP-21-TX-9910",
                "dispatchTime": "2026-10-20T08:00:00",
                "receivedTime": "2026-10-20T16:30:00",
                "status": "Recalled in Storage",
                "condition": "Insulated Crates",
                "notes": "Batch quarantined at hub after subsequent pesticide lab failure."
            },
            {
                "id": "TR-2026-504",
                "batchId": "TH-PLK-2026-019",
                "fromLocation": "Guntur Central Cold Hub",
                "toLocation": "Rythu Bazaar Superstore, Vijayawada",
                "dispatchedQuantityKg": 700,
                "receivedQuantityKg": 700,
                "transporter": "FastTrack ColdTrans AP",
                "vehicleNo": "AP-07-TJ-4421",
                "dispatchTime": "2026-10-21T06:00:00",
                "receivedTime": "2026-10-21T08:15:00",
                "status": "Quarantined at Retail",
                "condition": "Transit chilled",
                "notes": "Recalled stock isolated on store shelves."
            },
            {
                "id": "TR-2026-505",
                "batchId": "TH-PLK-2026-019",
                "fromLocation": "Guntur Central Cold Hub",
                "toLocation": "Nature's Basket AP, Visakhapatnam",
                "dispatchedQuantityKg": 500,
                "receivedQuantityKg": 500,
                "transporter": "Coastal Agri Haulers",
                "vehicleNo": "AP-03-X-8822",
                "dispatchTime": "2026-10-21T08:00:00",
                "receivedTime": "2026-10-21T18:30:00",
                "status": "Quarantined at Retail",
                "condition": "Dry freight",
                "notes": "Secondary downstream branch isolated."
            },
            {
                "id": "TR-2026-506",
                "batchId": "TH-GVA-2026-095",
                "fromLocation": "Godavari Greens Organics, Eluru",
                "toLocation": "Vijayawada Mega Agripark",
                "dispatchedQuantityKg": 1600,
                "receivedQuantityKg": 1600,
                "transporter": "FastTrack ColdTrans AP",
                "vehicleNo": "AP-07-TJ-4421",
                "dispatchTime": "2026-10-21T09:45:00",
                "receivedTime": "2026-10-21T16:00:00",
                "status": "Investigation Hold",
                "condition": "Excursion to 18.5°C logged",
                "notes": "Corridor NH-16 mechanical malfunction."
            }
        ],
        "inspections": [
            {
                "id": "INSP-8812",
                "batchId": "TH-TOM-2026-081",
                "crop": "Roma Tomatoes",
                "inspector": "Guntur Agri Quality Lab",
                "date": "2026-10-18T09:15:00",
                "status": "PASSED",
                "parameters": {
                    "brix": "5.2 (Std: 4.8-5.5)",
                    "firmness": "8.5 kg/cm²",
                    "pesticideResidue": "ND (<0.01 mg/kg)",
                    "ecoliColiform": "Zero CFU/g"
                },
                "docReference": "LAB-GT-2026-8812",
                "verdict": "Certified Grade A for commercial retail."
            },
            {
                "id": "INSP-901",
                "batchId": "TH-PLK-2026-019",
                "crop": "Organic Palak (Spinach)",
                "inspector": "AP Food Safety Analytical Lab",
                "date": "2026-10-22T10:00:00",
                "status": "FAILED",
                "parameters": {
                    "chlorpyrifos": "0.42 mg/kg (MRL: 0.05 mg/kg) [VIOLATION]",
                    "leadHeavyMetal": "0.08 mg/kg (Compliant)",
                    "salmonella": "Negative"
                },
                "docReference": "FSSAI-AP-RECALL-901",
                "verdict": "NON-COMPLIANT: Organophosphate pesticide residue 8.4x over legal safety limit."
            },
            {
                "id": "INSP-441",
                "batchId": "TH-GVA-2026-095",
                "crop": "Taiwan Pink Guavas",
                "inspector": "Eluru Agri Field Chemist",
                "date": "2026-10-21T08:00:00",
                "status": "PASSED",
                "parameters": {
                    "brix": "10.4",
                    "firmness": "7.8 kg/cm²",
                    "pestInfestation": "None"
                },
                "docReference": "EL-Q-2026-441",
                "verdict": "Approved pre-cooling intake."
            }
        ],
        "coldChainLogs": [
            { "timestamp": "2026-10-21T09:45:00", "batchId": "TH-GVA-2026-095", "route": "NH-16 Eluru - Vijayawada", "tempC": 5.2, "humidityPct": 88, "vehicleNo": "AP-07-TJ-4421", "status": "Normal" },
            { "timestamp": "2026-10-21T10:30:00", "batchId": "TH-GVA-2026-095", "route": "NH-16 Eluru - Vijayawada", "tempC": 6.8, "humidityPct": 87, "vehicleNo": "AP-07-TJ-4421", "status": "Normal" },
            { "timestamp": "2026-10-21T11:15:00", "batchId": "TH-GVA-2026-095", "route": "NH-16 Near Hanuman Junction", "tempC": 11.4, "humidityPct": 82, "vehicleNo": "AP-07-TJ-4421", "status": "Excursion Warning" },
            { "timestamp": "2026-10-21T12:00:00", "batchId": "TH-GVA-2026-095", "route": "NH-16 Near Hanuman Junction", "tempC": 16.2, "humidityPct": 76, "vehicleNo": "AP-07-TJ-4421", "status": "Critical Excursion" },
            { "timestamp": "2026-10-21T13:30:00", "batchId": "TH-GVA-2026-095", "route": "NH-16 Toll Gate Bypass", "tempC": 18.5, "humidityPct": 71, "vehicleNo": "AP-07-TJ-4421", "status": "Critical Excursion" },
            { "timestamp": "2026-10-21T14:45:00", "batchId": "TH-GVA-2026-095", "route": "NH-16 Vijayawada Outer", "tempC": 17.8, "humidityPct": 74, "vehicleNo": "AP-07-TJ-4421", "status": "Critical Excursion" },
            { "timestamp": "2026-10-21T15:30:00", "batchId": "TH-GVA-2026-095", "route": "Vijayawada Mega Agripark Intake", "tempC": 12.0, "humidityPct": 80, "vehicleNo": "AP-07-TJ-4421", "status": "Excursion Recovery" },
            { "timestamp": "2026-10-21T16:00:00", "batchId": "TH-GVA-2026-095", "route": "Vijayawada Cold Bay 4", "tempC": 6.0, "humidityPct": 89, "vehicleNo": "AP-07-TJ-4421", "status": "Normal" }
        ],
        "anomalies": [
            {
                "id": "ANOM-2026-01",
                "batchId": "TH-PLK-2026-019",
                "title": "Severe MRL Chemical Contamination Detected",
                "severity": "Critical",
                "crop": "Organic Palak (Spinach)",
                "category": "Quality Failure",
                "location": "Guntur Testing Lab",
                "detectedAt": "2026-10-22T10:00:00",
                "reason": "Chlorpyrifos pesticide level 0.42 mg/kg violates FSSAI maximum limit of 0.05 mg/kg by 840%.",
                "evidence": "Lab Report #FSSAI-AP-RECALL-901 confirmed by Gas Chromatography (GC-MS/MS).",
                "recommendedAction": "Initiate emergency recall; quarantine all stock at Guntur hub and downstream retail branches.",
                "humanReviewRequired": True,
                "status": "Under Active Recall"
            },
            {
                "id": "ANOM-2026-02",
                "batchId": "TH-GVA-2026-095",
                "title": "Extended Cold-Chain Thermal Excursion (>4 Hours)",
                "severity": "Critical",
                "crop": "Taiwan Pink Guavas",
                "category": "Cold-Chain Anomaly",
                "location": "NH-16 Corridor (Eluru -> Vijayawada)",
                "detectedAt": "2026-10-21T12:15:00",
                "reason": "Refrigeration compartment breached 8°C upper ceiling for 4.2 continuous hours, peaking at 18.5°C.",
                "evidence": "IoT Sensor #IoT-TMP-409 streaming telemetry log showing compressor stoppage.",
                "recommendedAction": "Hold batch at intake for microbial and firmness assay. Service vehicle reefer unit AP-07-TJ-4421.",
                "humanReviewRequired": True,
                "status": "Pending Investigation"
            },
            {
                "id": "ANOM-2026-03",
                "batchId": "TH-CHI-2026-067",
                "title": "Temporal Inversion (Dispatch Prior to Harvest)",
                "severity": "High",
                "crop": "Guntur Sannam Chillies",
                "category": "Timestamp Paradox",
                "location": "Tenali Farm Collection Centre",
                "detectedAt": "2026-10-21T14:05:00",
                "reason": "Transfer dispatch logged at 09:30 AM while farm harvest timestamp is 02:00 PM on the same date.",
                "evidence": "Audit logs: EV-067-1 (09:30) vs EV-067-2 (14:00). Digital signature mismatch.",
                "recommendedAction": "Request farmer and driver sign-off reconciliation. Check device clocks.",
                "humanReviewRequired": True,
                "status": "Unresolved Audit"
            },
            {
                "id": "ANOM-2026-04",
                "batchId": "TH-BNN-2026-112",
                "title": "Unexplained Quantity Inflation (+450 kg)",
                "severity": "High",
                "crop": "Robusta Cavendish Bananas",
                "category": "Quantity Mismatch",
                "location": "Rayalaseema Agro Depot Weighbridge",
                "detectedAt": "2026-10-17T17:35:00",
                "reason": "Received weight (5450 kg) exceeds dispatched bill of lading weight (5000 kg) by 9%.",
                "evidence": "Consignment Note AP-CH-991 vs Intake Scale Slip #WB-881.",
                "recommendedAction": "Inspect weighbridge calibration and check for commingling of unverified third-party fruit.",
                "humanReviewRequired": True,
                "status": "Unresolved Audit"
            },
            {
                "id": "ANOM-2026-05",
                "batchId": "TH-MNG-2026-042",
                "title": "Missing Mandatory Quality Inspection Record",
                "severity": "Medium",
                "crop": "Banganapalle Mangoes",
                "category": "Compliance Gap",
                "location": "Nuzvid Farm Gate",
                "detectedAt": "2026-10-19T15:00:00",
                "reason": "GI-tagged export mango batch was dispatched across district lines without attaching pre-cooling lab test.",
                "evidence": "Missing required document attachment in transfer payload TR-2026-440.",
                "recommendedAction": "Submit retrospective inspection certificate or quarantine at Tirupati depot.",
                "humanReviewRequired": True,
                "status": "Open Warning"
            }
        ],
        "recalls": [
            {
                "id": "REC-2026-001",
                "batchId": "TH-PLK-2026-019",
                "crop": "Organic Palak (Spinach)",
                "initiatedBy": "Dr. Aruna Reddy (Food Safety Admin)",
                "initiatedAt": "2026-10-22T11:30:00",
                "hazardType": "Chemical Contamination (Chlorpyrifos 0.42 mg/kg)",
                "severity": "Level 1 (Life-Threatening / Acute Toxicity)",
                "status": "Active Quarantine",
                "totalAffectedKg": 1200,
                "quarantinedKg": 1200,
                "affectedDestinations": [
                    {
                        "stakeholder": "Rythu Bazaar Superstore",
                        "type": "Retailer",
                        "location": "Benz Circle, Vijayawada",
                        "recordedQtyKg": 700,
                        "status": "Acknowledged & Quarantined",
                        "acknowledgedBy": "Priya Rao (Store Manager)",
                        "acknowledgedAt": "2026-10-22T12:05:00",
                        "correctiveAction": "Isolated 700 kg from cold display to HazMat disposal crate."
                    },
                    {
                        "stakeholder": "Nature's Basket AP",
                        "type": "Retailer",
                        "location": "Waltair Uplands, Visakhapatnam",
                        "recordedQtyKg": 500,
                        "status": "Pending Acknowledgement",
                        "acknowledgedBy": None,
                        "acknowledgedAt": None,
                        "correctiveAction": "Priority phone notice dispatched; waiting for supervisor signature."
                    },
                    {
                        "stakeholder": "Guntur Central Cold Hub",
                        "type": "Transit Hub",
                        "location": "Industrial Corridor, Guntur",
                        "recordedQtyKg": 1200,
                        "status": "Acknowledged & Quarantined",
                        "acknowledgedBy": "S. K. Verma (Hub Director)",
                        "acknowledgedAt": "2026-10-22T11:45:00",
                        "correctiveAction": "Quarantine tape applied to Bay 3 sorting area."
                    },
                    {
                        "stakeholder": "Deccan Express Logistics",
                        "type": "Transporter",
                        "location": "Kurnool Fleet Depot",
                        "recordedQtyKg": 1200,
                        "status": "Acknowledged & Cleared",
                        "acknowledgedBy": "Fleet Dispatcher",
                        "acknowledgedAt": "2026-10-22T12:10:00",
                        "correctiveAction": "Truck AP-21-TX-9910 disinfected and sanitized."
                    }
                ],
                "timeline": [
                    { "stage": "Laboratory Flag", "time": "2026-10-22T10:00:00", "status": "Completed" },
                    { "stage": "Recall Enactment", "time": "2026-10-22T11:30:00", "status": "Completed" },
                    { "stage": "Downstream Broadcast", "time": "2026-10-22T11:35:00", "status": "Completed" },
                    { "stage": "Retail Stock Isolation", "time": "2026-10-22T12:30:00", "status": "In Progress" },
                    { "stage": "Safe Destruction & Audit", "time": "2026-10-23T15:00:00", "status": "Pending" }
                ]
            }
        ],
        "auditLogs": [
            {
                "id": "AUD-001",
                "timestamp": "2026-10-22T11:30:00",
                "actor": "Dr. Aruna Reddy (Food Safety Admin)",
                "action": "INITIATE_RECALL",
                "target": "TH-PLK-2026-019",
                "details": "Level 1 Recall initiated for spinach batch due to chlorpyrifos 0.42 mg/kg. Transfer block enabled."
            },
            {
                "id": "AUD-002",
                "timestamp": "2026-10-22T12:05:00",
                "actor": "Priya Rao (Retailer)",
                "action": "ACKNOWLEDGE_RECALL",
                "target": "REC-2026-001 / Rythu Bazaar",
                "details": "Acknowledged quarantine of 700 kg batch stock."
            }
        ]
    }

def load_db() -> Dict[str, Any]:
    if not os.path.exists(DB_FILE):
        seed = get_initial_seed_data()
        save_db(seed)
        return seed
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        seed = get_initial_seed_data()
        save_db(seed)
        return seed

def save_db(data: Dict[str, Any]):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)

# --- Models ---
class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = "demo123"

class CreateBatchRequest(BaseModel):
    crop: str
    variety: str
    farmId: str
    region: str
    harvestDate: str
    quantityKg: float
    notes: Optional[str] = ""

class CreateTransferRequest(BaseModel):
    batchId: str
    fromLocation: str
    toLocation: str
    dispatchedQuantityKg: float
    receivedQuantityKg: Optional[float] = None
    transporter: str
    vehicleNo: str
    condition: Optional[str] = "Standard Ambient"
    notes: Optional[str] = ""

class CreateInspectionRequest(BaseModel):
    batchId: str
    inspector: str
    status: str  # PASSED or FAILED
    parameters: Dict[str, Any]
    docReference: str
    verdict: str

class SimulateColdChainRequest(BaseModel):
    batchId: str
    route: str
    spikeTempC: float
    durationHours: float
    vehicleNo: str

class InitiateRecallRequest(BaseModel):
    batchId: str
    hazardType: str
    severity: str
    initiatedBy: str
    notes: Optional[str] = ""

class AcknowledgeRecallRequest(BaseModel):
    recallId: str
    stakeholder: str
    acknowledgedBy: str
    correctiveAction: str

# --- API Endpoints ---

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "TraceHarvest AI",
        "version": "2.0.0",
        "region": "Andhra Pradesh, India",
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/data")
def get_all_data():
    return load_db()

@app.post("/api/demo/reset")
def reset_demo_data():
    seed = get_initial_seed_data()
    save_db(seed)
    return {"message": "Demo data successfully reset to clean Andhra Pradesh prototype baseline.", "success": True}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    db = load_db()
    users = db.get("users", [])
    user = next((u for u in users if u["email"].lower() == req.email.lower()), None)
    if not user:
        # If user not found, create or map role
        role = "Consumer"
        if "farmer" in req.email.lower(): role = "Farmer"
        elif "admin" in req.email.lower(): role = "Food Safety Admin"
        elif "trans" in req.email.lower(): role = "Transporter"
        elif "ware" in req.email.lower(): role = "Warehouse Manager"
        elif "retail" in req.email.lower(): role = "Retailer"
        user = {
            "id": f"u-{uuid.uuid4().hex[:6]}",
            "email": req.email,
            "name": req.email.split("@")[0].capitalize(),
            "role": role,
            "organization": "TraceHarvest Partner",
            "location": "Vijayawada, AP",
            "avatar": "👤",
            "phone": "+91 90000 00000",
            "credibilityScore": 90
        }
        users.append(user)
        save_db(db)
    return {"user": user, "token": f"th-demo-token-{user['id']}"}

@app.get("/api/batches")
def get_batches(q: Optional[str] = None, crop: Optional[str] = None, status: Optional[str] = None):
    db = load_db()
    batches = db.get("batches", [])
    if q:
        query_str = q.lower()
        batches = [b for b in batches if query_str in b["id"].lower() or query_str in b["crop"].lower() or query_str in b["farmName"].lower()]
    if crop:
        batches = [b for b in batches if crop.lower() in b["crop"].lower()]
    if status:
        batches = [b for b in batches if status.lower() in b["status"].lower()]
    return batches

@app.get("/api/batches/{batch_id}")
def get_batch_details(batch_id: str):
    db = load_db()
    batch = next((b for b in db.get("batches", []) if b["id"].lower() == batch_id.lower()), None)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # Calculate connected downstream destinations and transfers
    linked_transfers = [t for t in db.get("transfers", []) if t["batchId"].lower() == batch_id.lower()]
    linked_inspections = [i for i in db.get("inspections", []) if i["batchId"].lower() == batch_id.lower()]
    linked_anomalies = [a for a in db.get("anomalies", []) if a["batchId"].lower() == batch_id.lower()]
    linked_recall = next((r for r in db.get("recalls", []) if r["batchId"].lower() == batch_id.lower()), None)

    return {
        "batch": batch,
        "transfers": linked_transfers,
        "inspections": linked_inspections,
        "anomalies": linked_anomalies,
        "recall": linked_recall
    }

@app.post("/api/batches")
def create_batch(req: CreateBatchRequest):
    db = load_db()
    farm = next((f for f in db.get("farms", []) if f["id"] == req.farmId), None)
    farm_name = farm["name"] if farm else "Registered AP Farm"
    
    # Auto-generate unique batch ID
    prefix = req.crop[:3].upper() if len(req.crop) >= 3 else "CRX"
    batch_num = len(db.get("batches", [])) + 82
    batch_id = f"TH-{prefix}-2026-{batch_num:03d}"
    
    now_str = datetime.datetime.now().isoformat()
    new_batch = {
        "id": batch_id,
        "crop": req.crop,
        "variety": req.variety,
        "farmId": req.farmId,
        "farmName": farm_name,
        "region": req.region,
        "harvestDate": req.harvestDate,
        "quantityKg": req.quantityKg,
        "currentQuantityKg": req.quantityKg,
        "status": "Harvest Registered",
        "recallStatus": "CLEAR",
        "riskLevel": "Low",
        "dataCompleteness": 92,
        "qrPayload": f"https://traceharvest.ai/verify/{batch_id}",
        "currentHolder": farm_name,
        "notes": req.notes,
        "timelineEvents": [
            {
                "id": f"EV-{batch_num}-1",
                "type": "HARVEST",
                "timestamp": req.harvestDate,
                "actor": farm["owner"] if farm else "Farmer",
                "location": req.region,
                "details": f"Registered harvest of {req.quantityKg} kg {req.crop} ({req.variety}). Digital Passport created.",
                "verified": True
            }
        ]
    }
    
    db["batches"].insert(0, new_batch)
    db["auditLogs"].insert(0, {
        "id": f"AUD-{uuid.uuid4().hex[:6]}",
        "timestamp": now_str,
        "actor": farm["owner"] if farm else "Farmer",
        "action": "CREATE_BATCH",
        "target": batch_id,
        "details": f"Farmer registered new batch {batch_id} with {req.quantityKg} kg."
    })
    
    save_db(db)
    return new_batch

@app.post("/api/transfers")
def record_transfer(req: CreateTransferRequest):
    db = load_db()
    batch = next((b for b in db.get("batches", []) if b["id"].lower() == req.batchId.lower()), None)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # CRITICAL BACKEND ENFORCEMENT: Recalled batches cannot be transferred!
    if batch.get("recallStatus") == "RECALLED" or "RECALLED" in batch.get("status", ""):
        raise HTTPException(
            status_code=403,
            detail=f"SECURITY LOCK: Batch {batch['id']} is currently under an ACTIVE FOOD SAFETY RECALL quarantine. All physical movement and transfers are strictly prohibited by Andhra Food Safety Authority (FSSAI)."
        )
    
    now_str = datetime.datetime.now().isoformat()
    transfer_id = f"TR-2026-{len(db.get('transfers', [])) + 507}"
    
    received_qty = req.receivedQuantityKg if req.receivedQuantityKg is not None else req.dispatchedQuantityKg
    
    # Rule check: quantity mismatch
    is_mismatch = abs(received_qty - req.dispatchedQuantityKg) > (req.dispatchedQuantityKg * 0.05)
    
    new_transfer = {
        "id": transfer_id,
        "batchId": batch["id"],
        "fromLocation": req.fromLocation,
        "toLocation": req.toLocation,
        "dispatchedQuantityKg": req.dispatchedQuantityKg,
        "receivedQuantityKg": received_qty,
        "transporter": req.transporter,
        "vehicleNo": req.vehicleNo,
        "dispatchTime": now_str,
        "receivedTime": now_str,
        "status": "Completed" if received_qty else "In Transit",
        "condition": req.condition,
        "notes": req.notes
    }
    db["transfers"].insert(0, new_transfer)
    
    # Update batch status and location
    batch["currentHolder"] = req.toLocation
    batch["status"] = f"Transferred to {req.toLocation.split(',')[0]}"
    batch["timelineEvents"].append({
        "id": f"EV-TR-{uuid.uuid4().hex[:5]}",
        "type": "TRANSFER",
        "timestamp": now_str,
        "actor": req.transporter,
        "location": f"{req.fromLocation} -> {req.toLocation}",
        "details": f"Dispatched {req.dispatchedQuantityKg} kg (Vehicle: {req.vehicleNo}). Condition: {req.condition}.",
        "verified": True
    })
    
    if is_mismatch:
        anomaly_id = f"ANOM-2026-{len(db.get('anomalies', [])) + 1:02d}"
        db["anomalies"].insert(0, {
            "id": anomaly_id,
            "batchId": batch["id"],
            "title": f"Quantity Discrepancy in Transfer ({req.dispatchedQuantityKg} vs {received_qty} kg)",
            "severity": "High",
            "crop": batch["crop"],
            "category": "Quantity Mismatch",
            "location": req.toLocation,
            "detectedAt": now_str,
            "reason": f"Dispatched weight was {req.dispatchedQuantityKg} kg but receiver recorded {received_qty} kg.",
            "evidence": f"Transfer record {transfer_id} with vehicle {req.vehicleNo}.",
            "recommendedAction": "Hold consignment for physical re-weighing and cross-check driver bill of lading.",
            "humanReviewRequired": True,
            "status": "Pending Review"
        })
        batch["riskLevel"] = "High"
    
    db["auditLogs"].insert(0, {
        "id": f"AUD-{uuid.uuid4().hex[:6]}",
        "timestamp": now_str,
        "actor": req.transporter,
        "action": "RECORD_TRANSFER",
        "target": batch["id"],
        "details": f"Transfer {transfer_id} executed to {req.toLocation} for {req.dispatchedQuantityKg} kg."
    })
    
    save_db(db)
    return new_transfer

@app.post("/api/inspections")
def record_inspection(req: CreateInspectionRequest):
    db = load_db()
    batch = next((b for b in db.get("batches", []) if b["id"].lower() == req.batchId.lower()), None)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    now_str = datetime.datetime.now().isoformat()
    insp_id = f"INSP-{len(db.get('inspections', [])) + 902}"
    
    new_insp = {
        "id": insp_id,
        "batchId": batch["id"],
        "crop": batch["crop"],
        "inspector": req.inspector,
        "date": now_str,
        "status": req.status.upper(),
        "parameters": req.parameters,
        "docReference": req.docReference,
        "verdict": req.verdict
    }
    db["inspections"].insert(0, new_insp)
    
    event_type = "INSPECTION_PASSED" if req.status.upper() == "PASSED" else "INSPECTION_FAILED"
    batch["timelineEvents"].append({
        "id": f"EV-INSP-{uuid.uuid4().hex[:5]}",
        "type": event_type,
        "timestamp": now_str,
        "actor": req.inspector,
        "location": batch.get("currentHolder", "Inspection Point"),
        "details": f"Quality status: {req.status.upper()}. {req.verdict}",
        "verified": True,
        "docRef": req.docReference
    })
    
    if req.status.upper() == "FAILED":
        batch["riskLevel"] = "Critical"
        anomaly_id = f"ANOM-2026-{len(db.get('anomalies', [])) + 1:02d}"
        db["anomalies"].insert(0, {
            "id": anomaly_id,
            "batchId": batch["id"],
            "title": f"Quality Inspection Failure: {req.docReference}",
            "severity": "Critical",
            "crop": batch["crop"],
            "category": "Quality Failure",
            "location": batch.get("currentHolder", "Quality Lab"),
            "detectedAt": now_str,
            "reason": f"Lab inspection failed criteria: {req.verdict}",
            "evidence": f"Inspection report {req.docReference} by {req.inspector}.",
            "recommendedAction": "Immediate quarantine of batch; initiate Recall Command Centre investigation.",
            "humanReviewRequired": True,
            "status": "Pending Investigation"
        })
    else:
        if batch["riskLevel"] == "Medium":
            batch["riskLevel"] = "Low"
            
    save_db(db)
    return new_insp

@app.post("/api/coldchain/simulate-excursion")
def simulate_coldchain_excursion(req: SimulateColdChainRequest):
    db = load_db()
    batch = next((b for b in db.get("batches", []) if b["id"].lower() == req.batchId.lower()), None)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    now_str = datetime.datetime.now().isoformat()
    # Add excursion readings
    new_logs = [
        { "timestamp": now_str, "batchId": batch["id"], "route": req.route, "tempC": req.spikeTempC, "humidityPct": 75, "vehicleNo": req.vehicleNo, "status": "Simulated Critical Excursion" }
    ]
    db["coldChainLogs"].extend(new_logs)
    
    # Update batch
    batch["riskLevel"] = "Critical"
    batch["status"] = "Cold-Chain Breach Flagged"
    batch["timelineEvents"].append({
        "id": f"EV-EXC-{uuid.uuid4().hex[:5]}",
        "type": "COLD_CHAIN_EXCURSION",
        "timestamp": now_str,
        "actor": "Simulated IoT Telemetry",
        "location": req.route,
        "details": f"Simulated temperature excursion: {req.spikeTempC}°C for {req.durationHours} hrs (Threshold: 8.0°C).",
        "verified": True
    })
    
    # Create anomaly
    anomaly_id = f"ANOM-2026-{len(db.get('anomalies', [])) + 1:02d}"
    new_anomaly = {
        "id": anomaly_id,
        "batchId": batch["id"],
        "title": f"Simulated Cold-Chain Excursion ({req.spikeTempC}°C on {req.route})",
        "severity": "Critical",
        "crop": batch["crop"],
        "category": "Cold-Chain Anomaly",
        "location": req.route,
        "detectedAt": now_str,
        "reason": f"Recorded sensor breach of {req.spikeTempC}°C exceeding allowable limits for {req.durationHours} hours.",
        "evidence": f"IoT Sensor reading logged on vehicle {req.vehicleNo}.",
        "recommendedAction": "Quarantine consignment; route to Bull's-Eye Precision Investigation.",
        "humanReviewRequired": True,
        "status": "Pending Investigation"
    }
    db["anomalies"].insert(0, new_anomaly)
    
    save_db(db)
    return {"message": "Simulated excursion recorded successfully", "anomaly": new_anomaly, "batch": batch}

@app.post("/api/recall/initiate")
def initiate_recall(req: InitiateRecallRequest):
    db = load_db()
    batch = next((b for b in db.get("batches", []) if b["id"].lower() == req.batchId.lower()), None)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    now_str = datetime.datetime.now().isoformat()
    
    # Graph traversal to find all downstream destinations and calculate quantities without double counting
    linked_transfers = [t for t in db.get("transfers", []) if t["batchId"].lower() == req.batchId.lower()]
    
    # Trace destinations
    destinations = []
    seen_dest_locations = set()
    total_downstream_qty = 0
    
    # Add origin farm
    farm = next((f for f in db.get("farms", []) if f["id"] == batch.get("farmId")), None)
    if farm:
        destinations.append({
            "stakeholder": farm["name"],
            "type": "Origin Farm",
            "location": farm["region"],
            "recordedQtyKg": batch.get("quantityKg", 0),
            "status": "Origin Quarantined",
            "acknowledgedBy": farm["owner"],
            "acknowledgedAt": now_str,
            "correctiveAction": "Field harvest halted; soil & water sampling order issued."
        })
        seen_dest_locations.add(farm["name"])
    
    # Collect downstream nodes from transfers
    for t in linked_transfers:
        to_loc = t.get("toLocation", "")
        stakeholder_name = to_loc.split(",")[0]
        stype = "Retailer" if "Bazaar" in to_loc or "Basket" in to_loc or "Super" in to_loc or "Retail" in to_loc else "Transit Hub / Warehouse"
        
        if stakeholder_name not in seen_dest_locations:
            seen_dest_locations.add(stakeholder_name)
            qty = t.get("receivedQuantityKg", t.get("dispatchedQuantityKg", 0))
            destinations.append({
                "stakeholder": stakeholder_name,
                "type": stype,
                "location": to_loc,
                "recordedQtyKg": qty,
                "status": "Pending Acknowledgement",
                "acknowledgedBy": None,
                "acknowledgedAt": None,
                "correctiveAction": "Emergency recall broadcast delivered. Physical quarantine order active."
            })
            if stype == "Retailer":
                total_downstream_qty += qty

    if total_downstream_qty == 0:
        total_downstream_qty = batch.get("quantityKg", 0)

    recall_id = f"REC-2026-{len(db.get('recalls', [])) + 1:03d}"
    recall_record = {
        "id": recall_id,
        "batchId": batch["id"],
        "crop": batch["crop"],
        "initiatedBy": req.initiatedBy,
        "initiatedAt": now_str,
        "hazardType": req.hazardType,
        "severity": req.severity,
        "status": "Active Quarantine",
        "totalAffectedKg": batch.get("quantityKg", 0),
        "quarantinedKg": total_downstream_qty,
        "affectedDestinations": destinations,
        "notes": req.notes,
        "timeline": [
            { "stage": "Laboratory Finding Verified", "time": now_str, "status": "Completed" },
            { "stage": "Recall Command Center Enacted", "time": now_str, "status": "Completed" },
            { "stage": "Multi-tier Downstream Broadcast", "time": now_str, "status": "Completed" },
            { "stage": "Physical Stock Isolation", "time": now_str, "status": "In Progress" },
            { "stage": "Audit & Chain of Custody Closure", "time": "", "status": "Pending" }
        ]
    }
    
    # Update batch state
    batch["recallStatus"] = "RECALLED"
    batch["status"] = "RECALLED - QUARANTINED"
    batch["riskLevel"] = "Critical"
    batch["timelineEvents"].append({
        "id": f"EV-REC-{uuid.uuid4().hex[:5]}",
        "type": "RECALL_ISSUED",
        "timestamp": now_str,
        "actor": req.initiatedBy,
        "location": "Andhra Food Safety Command HQ",
        "details": f"RECALL ENFORCED: {req.hazardType} ({req.severity}). {len(destinations)} destinations isolated. Transfer lock active.",
        "verified": True
    })
    
    db["recalls"].insert(0, recall_record)
    db["auditLogs"].insert(0, {
        "id": f"AUD-{uuid.uuid4().hex[:6]}",
        "timestamp": now_str,
        "actor": req.initiatedBy,
        "action": "INITIATE_RECALL",
        "target": batch["id"],
        "details": f"Food safety recall {recall_id} enacted on {batch['id']}. Affected destinations: {len(destinations)}."
    })
    
    save_db(db)
    return recall_record

@app.post("/api/recall/acknowledge")
def acknowledge_recall(req: AcknowledgeRecallRequest):
    db = load_db()
    recall = next((r for r in db.get("recalls", []) if r["id"].lower() == req.recallId.lower()), None)
    if not recall:
        raise HTTPException(status_code=404, detail="Recall record not found")
    
    dest = next((d for d in recall.get("affectedDestinations", []) if req.stakeholder.lower() in d["stakeholder"].lower()), None)
    if not dest:
        raise HTTPException(status_code=404, detail="Stakeholder destination not found in recall")
    
    now_str = datetime.datetime.now().isoformat()
    dest["status"] = "Acknowledged & Quarantined"
    dest["acknowledgedBy"] = req.acknowledgedBy
    dest["acknowledgedAt"] = now_str
    dest["correctiveAction"] = req.correctiveAction
    
    db["auditLogs"].insert(0, {
        "id": f"AUD-{uuid.uuid4().hex[:6]}",
        "timestamp": now_str,
        "actor": req.acknowledgedBy,
        "action": "ACKNOWLEDGE_RECALL",
        "target": f"{req.recallId} / {dest['stakeholder']}",
        "details": f"Quarantine verified: {req.correctiveAction}"
    })
    
    save_db(db)
    return {"message": "Recall successfully acknowledged and quarantine confirmed", "destination": dest}

# --- FEATURE 1: TREND INTELLIGENCE ENGINE ---
@app.get("/api/trends")
def get_trend_intelligence():
    db = load_db()
    batches = db.get("batches", [])
    transfers = db.get("transfers", [])
    inspections = db.get("inspections", [])
    anomalies = db.get("anomalies", [])
    cold_logs = db.get("coldChainLogs", [])
    recalls = db.get("recalls", [])
    
    total_batches = len(batches)
    total_incidents = len(anomalies) + len(recalls)
    
    # Inspection failure rate
    failed_insps = [i for i in inspections if i.get("status", "").upper() == "FAILED"]
    failure_rate = round((len(failed_insps) / len(inspections) * 100), 1) if inspections else 0.0
    
    # Missing record rate (batches with dataCompleteness < 80%)
    incomplete_batches = [b for b in batches if b.get("dataCompleteness", 100) < 80]
    missing_record_rate = round((len(incomplete_batches) / total_batches * 100), 1) if total_batches else 0.0
    
    # Transport exception rate
    excursion_logs = [c for c in cold_logs if "Excursion" in c.get("status", "")]
    transport_exception_rate = round((len(excursion_logs) / len(cold_logs) * 100), 1) if cold_logs else 0.0
    
    # Batches requiring investigation
    batches_under_investigation = [b for b in batches if b.get("riskLevel") in ["High", "Critical"] or b.get("recallStatus") == "RECALLED"]
    
    # Crop-wise risk distribution
    crop_risk = {}
    for b in batches:
        c = b.get("crop", "Unknown")
        if c not in crop_risk:
            crop_risk[c] = {"total": 0, "highRisk": 0, "quantityKg": 0}
        crop_risk[c]["total"] += 1
        crop_risk[c]["quantityKg"] += b.get("quantityKg", 0)
        if b.get("riskLevel") in ["High", "Critical"]:
            crop_risk[c]["highRisk"] += 1
            
    # Region-wise incident breakdown
    region_incidents = {}
    for a in anomalies:
        loc = a.get("location", "Andhra Pradesh")
        reg = "Guntur" if "Guntur" in loc or "Tenali" in loc else \
              "Krishna" if "Krishna" in loc or "Nuzvid" in loc or "Vijayawada" in loc else \
              "Kurnool" if "Kurnool" in loc or "Adoni" in loc else \
              "Chittoor" if "Chittoor" in loc or "Tirupati" in loc else \
              "Godavari / NH-16" if "Eluru" in loc or "NH-16" in loc else "Other AP Hubs"
        region_incidents[reg] = region_incidents.get(reg, 0) + 1

    # Detected Recurring Risk Patterns (Rule-based explainable pattern detector)
    patterns = [
        {
            "id": "PAT-001",
            "title": "Recurring Cold-Chain Excursions on NH-16 Coastal Corridor",
            "severity": "Critical",
            "dateRange": "2026-10-18 to 2026-10-24",
            "supportingRecordsCount": 6,
            "affectedBatches": ["TH-GVA-2026-095"],
            "route": "NH-16 Eluru - Hanuman Junction - Vijayawada",
            "evidence": "4.2 hour continuous compressor thermal failure logged on Reefer AP-07-TJ-4421, reaching 18.5°C.",
            "recommendedInvestigation": "Audit FastTrack ColdTrans fleet maintenance records and evaluate refrigeration backup alternators.",
            "targetBatchId": "TH-GVA-2026-095"
        },
        {
            "id": "PAT-002",
            "title": "Severe Organophosphate Chemical Residue in Kurnool Leafy Greens",
            "severity": "Critical",
            "dateRange": "2026-10-20 to 2026-10-22",
            "supportingRecordsCount": 5,
            "affectedBatches": ["TH-PLK-2026-019"],
            "route": "Adoni -> Guntur Central Cold Hub -> Retailers",
            "evidence": "Chlorpyrifos detected at 0.42 mg/kg (MRL 0.05 mg/kg). Downstream distribution spans 2 supermarkets.",
            "recommendedInvestigation": "Examine agrochemical sprayer calibration and verify organic certification compliance at Tungabhadra Collective.",
            "targetBatchId": "TH-PLK-2026-019"
        },
        {
            "id": "PAT-003",
            "title": "Weighbridge Inbound Quantity Inflation (+9%) at Chittoor Depot",
            "severity": "High",
            "dateRange": "2026-10-17 to 2026-10-21",
            "supportingRecordsCount": 3,
            "affectedBatches": ["TH-BNN-2026-112"],
            "route": "Chittoor Orchards -> Rayalaseema Agro Depot",
            "evidence": "Dispatched weight was 5000 kg, but intake weighbridge recorded 5450 kg without supporting documentation.",
            "recommendedInvestigation": "Inspect load cell calibration on Depot Scale #2 and cross-check driver bill of lading.",
            "targetBatchId": "TH-BNN-2026-112"
        },
        {
            "id": "PAT-004",
            "title": "Dispatch Timestamp Inversions at Tenali Farm Gate",
            "severity": "High",
            "dateRange": "2026-10-21",
            "supportingRecordsCount": 2,
            "affectedBatches": ["TH-CHI-2026-067"],
            "route": "Tenali Collection Centre -> Guntur Cold Hub",
            "evidence": "Transfer dispatch logged 4.5 hours prior to recorded farm harvest time.",
            "recommendedInvestigation": "Check farm mobile device NTP clock synchronization and investigate pre-booking transfer practices.",
            "targetBatchId": "TH-CHI-2026-067"
        }
    ]

    return {
        "metrics": {
            "totalBatches": total_batches,
            "totalIncidents": total_incidents,
            "qualityFailureRate": failure_rate,
            "missingRecordRate": missing_record_rate,
            "transportExceptionRate": transport_exception_rate,
            "batchesUnderInvestigation": len(batches_under_investigation),
            "recurringRiskPatternsCount": len(patterns),
            "repeatedIncidentCorridorsCount": 2
        },
        "cropRisk": crop_risk,
        "regionIncidents": region_incidents,
        "patterns": patterns,
        "historicalTimeline": [
            { "date": "2026-10-18", "incidents": 0, "normalBatches": 3, "avgTemp": 7.4 },
            { "date": "2026-10-19", "incidents": 1, "normalBatches": 2, "avgTemp": 7.8 },
            { "date": "2026-10-20", "incidents": 2, "normalBatches": 2, "avgTemp": 8.1 },
            { "date": "2026-10-21", "incidents": 4, "normalBatches": 3, "avgTemp": 14.5 },
            { "date": "2026-10-22", "incidents": 3, "normalBatches": 2, "avgTemp": 8.0 },
            { "date": "2026-10-23", "incidents": 2, "normalBatches": 4, "avgTemp": 7.6 },
            { "date": "2026-10-24", "incidents": 1, "normalBatches": 4, "avgTemp": 7.2 }
        ]
    }

# --- FEATURE 2: BULL'S-EYE PRECISION INVESTIGATION ENGINE ---
@app.get("/api/bullseye/{batch_id}")
def get_bullseye_investigation(batch_id: str):
    db = load_db()
    batch = next((b for b in db.get("batches", []) if b["id"].lower() == batch_id.lower()), None)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found for Bull's-Eye investigation")
    
    transfers = [t for t in db.get("transfers", []) if t["batchId"].lower() == batch_id.lower()]
    inspections = [i for i in db.get("inspections", []) if i["batchId"].lower() == batch_id.lower()]
    anomalies = [a for a in db.get("anomalies", []) if a["batchId"].lower() == batch_id.lower()]
    cold_logs = [c for c in db.get("coldChainLogs", []) if c["batchId"].lower() == batch_id.lower()]
    recall = next((r for r in db.get("recalls", []) if r["batchId"].lower() == batch_id.lower()), None)
    farm = next((f for f in db.get("farms", []) if f["id"] == batch.get("farmId")), None)
    
    # Calculate Risk-Priority Score (0 to 100)
    score = 15.0 # baseline
    score_breakdown = []
    
    # 1. Quality inspection
    if any(i.get("status") == "FAILED" for i in inspections):
        score += 35.0
        score_breakdown.append({"factor": "Lab Quality Failure", "points": "+35", "detail": "Exceeded legal chemical MRL limit"})
    elif not inspections:
        score += 15.0
        score_breakdown.append({"factor": "Missing Mandatory Inspection", "points": "+15", "detail": "No certified lab documentation attached"})
    
    # 2. Cold chain excursion
    excursions = [c for c in cold_logs if c.get("tempC", 0) > 10.0]
    if excursions:
        max_temp = max(c["tempC"] for c in excursions)
        score += 30.0
        score_breakdown.append({"factor": "Severe Temperature Excursion", "points": "+30", "detail": f"Peak {max_temp}°C in reefer transit"})
    
    # 3. Anomalies
    if anomalies:
        score += min(len(anomalies) * 10.0, 20.0)
        score_breakdown.append({"factor": "AI Detective Anomalies", "points": f"+{min(len(anomalies)*10, 20)}", "detail": f"{len(anomalies)} suspicious pattern(s) identified"})
        
    # 4. Downstream Destination Exposure
    downstream_destinations = []
    seen = set()
    for t in transfers:
        loc = t.get("toLocation", "")
        if loc not in seen:
            seen.add(loc)
            is_retail = "Bazaar" in loc or "Basket" in loc or "Retail" in loc
            downstream_destinations.append({
                "name": loc.split(",")[0],
                "fullLocation": loc,
                "type": "Retail Shelf Point" if is_retail else "Transit Distribution Hub",
                "receivedKg": t.get("receivedQuantityKg", t.get("dispatchedQuantityKg", 0)),
                "status": "Quarantined" if batch.get("recallStatus") == "RECALLED" else "Potentially Exposed"
            })
            
    if len(downstream_destinations) >= 2:
        score += 10.0
        score_breakdown.append({"factor": "Multi-tier Downstream Exposure", "points": "+10", "detail": f"{len(downstream_destinations)} downstream facilities reached"})
    
    final_score = min(int(score), 100)
    
    # Build Radial Ring Structure
    # CENTER: Incident Target
    center = {
        "id": batch["id"],
        "title": f"{batch['crop']} ({batch['variety']})",
        "farm": batch["farmName"],
        "quantityKg": batch["quantityKg"],
        "severity": batch.get("riskLevel", "Low"),
        "status": batch.get("status", "Active"),
        "recallStatus": batch.get("recallStatus", "CLEAR"),
        "riskScore": final_score
    }
    
    # RING 1: Direct Evidence
    ring1_evidence = []
    for insp in inspections:
        ring1_evidence.append({
            "id": insp["id"],
            "type": "Laboratory Inspection",
            "status": insp["status"],
            "label": f"Lab Report: {insp['docReference']}",
            "detail": insp["verdict"],
            "date": insp["date"],
            "severity": "Critical" if insp["status"] == "FAILED" else "Low"
        })
    for anom in anomalies:
        ring1_evidence.append({
            "id": anom["id"],
            "type": "AI Detective Finding",
            "status": anom["severity"],
            "label": anom["title"],
            "detail": anom["reason"],
            "date": anom["detectedAt"],
            "severity": anom["severity"]
        })
    for exc in excursions[:2]:
        ring1_evidence.append({
            "id": f"EXC-{uuid.uuid4().hex[:4]}",
            "type": "IoT Sensor Telemetry",
            "status": "Excursion",
            "label": f"Sensor Alert: {exc['tempC']}°C",
            "detail": f"Breach recorded along {exc['route']} on vehicle {exc['vehicleNo']}",
            "date": exc["timestamp"],
            "severity": "Critical"
        })
        
    # RING 2: Connected Supply Chain
    ring2_supply_chain = []
    if farm:
        ring2_supply_chain.append({
            "id": farm["id"],
            "type": "Origin Farm",
            "name": farm["name"],
            "owner": farm["owner"],
            "location": farm["region"],
            "certifications": farm.get("certifications", [])
        })
    for t in transfers:
        ring2_supply_chain.append({
            "id": t["id"],
            "type": "Logistics Carrier",
            "transporter": t["transporter"],
            "vehicle": t["vehicleNo"],
            "from": t["fromLocation"].split(",")[0],
            "to": t["toLocation"].split(",")[0],
            "condition": t["condition"],
            "dispatchedKg": t["dispatchedQuantityKg"]
        })
        
    # RING 3: Potentially Affected Destinations
    ring3_destinations = downstream_destinations
    
    # OUTER RING: Context & Trends
    outer_ring_context = [
        {
            "id": "CTX-1",
            "title": "Regional Agrochemical Risk Corridor",
            "description": f"District surveillance in {batch['region'].split(',')[0]} shows elevated monitoring this harvest cycle."
        },
        {
            "id": "CTX-2",
            "title": "Cold-Chain Fleet Telemetry Reliability",
            "description": "FastTrack ColdTrans fleet AP-07 series has 2 flagged thermal spikes in the last 72 hours."
        },
        {
            "id": "CTX-3",
            "title": "FSSAI Mandatory Traceability Compliance",
            "description": "Standard compliance protocol requires all tier-1 handlers to acknowledge notice within 120 minutes."
        }
    ]
    
    return {
        "batch": batch,
        "riskScore": final_score,
        "scoreBreakdown": score_breakdown,
        "bullseye": {
            "center": center,
            "ring1_evidence": ring1_evidence,
            "ring2_supplyChain": ring2_supply_chain,
            "ring3_destinations": ring3_destinations,
            "outerRing_context": outer_ring_context
        },
        "raw": {
            "transfers": transfers,
            "inspections": inspections,
            "anomalies": anomalies,
            "coldLogs": cold_logs,
            "recall": recall
        }
    }

# --- FEATURE 5: INVESTIGATION & INCIDENT REPORTS ---
@app.get("/api/reports/incident/{batch_id}")
def get_incident_report(batch_id: str):
    bullseye_data = get_bullseye_investigation(batch_id)
    batch = bullseye_data["batch"]
    center = bullseye_data["bullseye"]["center"]
    ring1 = bullseye_data["bullseye"]["ring1_evidence"]
    destinations = bullseye_data["bullseye"]["ring3_destinations"]
    
    report_id = f"INC-REP-{batch['id']}-{datetime.datetime.now().strftime('%Y%m%d%H%M')}"
    
    return {
        "reportId": report_id,
        "generatedAt": datetime.datetime.now().isoformat(),
        "investigationAuthority": "TraceHarvest AI - FSSAI Agri-Intelligence Unit",
        "targetBatch": {
            "id": batch["id"],
            "crop": batch["crop"],
            "variety": batch["variety"],
            "farmName": batch["farmName"],
            "region": batch["region"],
            "harvestDate": batch["harvestDate"],
            "totalVolumeKg": batch["quantityKg"]
        },
        "riskPriorityScore": bullseye_data["riskScore"],
        "severity": center["severity"],
        "triggeringEvidence": ring1,
        "connectedDownstreamDestinations": destinations,
        "quarantineStatus": batch.get("recallStatus", "CLEAR"),
        "recommendedActions": [
            "Initiate or verify immediate physical quarantine of stock at all downstream retail and distribution points.",
            "Seal tamper-evident custody tags and impound logistics vehicle records.",
            "Conduct confirmatory gas chromatography / microbial mass spectrometry within 24 hours.",
            "Broadcast citizen advisory on public QR passport portal if produce has reached retail shelves."
        ],
        "disclaimer": "This intelligence report was generated using algorithmic supply chain verification, IoT sensor logs, and digital chain of custody telemetry. Human inspector confirmatory sign-off is legally required for disposal."
    }

@app.get("/api/reports/export/csv")
def export_csv_data(type: str = "batches"):
    db = load_db()
    lines = []
    if type == "batches":
        lines.append("Batch ID,Crop,Variety,Farm,Region,Harvest Date,Quantity (kg),Risk Level,Status,Recall Status,Data Completeness (%)")
        for b in db.get("batches", []):
            lines.append(f'"{b["id"]}","{b["crop"]}","{b["variety"]}","{b["farmName"]}","{b["region"]}","{b["harvestDate"]}",{b["quantityKg"]},"{b["riskLevel"]}","{b["status"]}","{b["recallStatus"]}",{b.get("dataCompleteness", 100)}')
    elif type == "transfers":
        lines.append("Transfer ID,Batch ID,From Location,To Location,Dispatched (kg),Received (kg),Transporter,Vehicle,Status")
        for t in db.get("transfers", []):
            lines.append(f'"{t["id"]}","{t["batchId"]}","{t["fromLocation"]}","{t["toLocation"]}",{t["dispatchedQuantityKg"]},{t["receivedQuantityKg"]},"{t["transporter"]}","{t["vehicleNo"]}","{t["status"]}"')
    elif type == "anomalies":
        lines.append("Anomaly ID,Batch ID,Title,Severity,Crop,Category,Location,Detected At,Status")
        for a in db.get("anomalies", []):
            lines.append(f'"{a["id"]}","{a["batchId"]}","{a["title"]}","{a["severity"]}","{a["crop"]}","{a["category"]}","{a["location"]}","{a["detectedAt"]}","{a["status"]}"')
    elif type == "recalls":
        lines.append("Recall ID,Batch ID,Crop,Hazard Type,Severity,Initiated By,Initiated At,Status,Total Affected (kg)")
        for r in db.get("recalls", []):
            lines.append(f'"{r["id"]}","{r["batchId"]}","{r["crop"]}","{r["hazardType"]}","{r["severity"]}","{r["initiatedBy"]}","{r["initiatedAt"]}","{r["status"]}",{r["totalAffectedKg"]}')
            
    content = "\n".join(lines)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=traceharvest_{type}_{datetime.datetime.now().strftime('%Y%m%d')}.csv"}
    )

# Static files mount
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/{full_path:path}", response_class=HTMLResponse)
def serve_index(full_path: str):
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>TraceHarvest AI Backend Running. Static index.html loading...</h1>"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
