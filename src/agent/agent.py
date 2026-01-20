# Before running the sample:
#     pip install --pre -r requirements.txt
#     Create a .env file based on the .env.sample file and fill in the required values.

import os
from dotenv import load_dotenv
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import MCPTool, PromptAgentDefinition, BingGroundingAgentTool, BingGroundingSearchToolParameters, BingGroundingSearchConfiguration

load_dotenv()

# Load configuration from environment variables
ai_proj_endpoint = os.getenv("AZURE_AI_PROJECT_ENDPOINT")
agent_name = os.getenv("AGENT_NAME")
agent_model = os.getenv("AGENT_MODEL")
cosmosdb_mcp_server_url = os.getenv("COSMOSDB_MCP_SERVER_URI")
cosmosdb_mcp_connection_name = os.getenv("COSMOSDB_MCP_CONNECTION_NAME")
bing_connection_name = os.getenv("BING_CONNECTION_NAME")

proj_client = AIProjectClient(endpoint=ai_proj_endpoint, credential=DefaultAzureCredential())

# Load instructions from external file
script_dir = os.path.dirname(os.path.abspath(__file__))
instructions_path = os.path.join(script_dir, "instructions.txt")
with open(instructions_path, "r", encoding="utf-8") as f:
    instructions = f.read()

mcp_tool_db = MCPTool(
    type="mcp",
    server_label=cosmosdb_mcp_connection_name,
    project_connection_id=cosmosdb_mcp_connection_name,
    server_url=cosmosdb_mcp_server_url,
    require_approval="never"
)

bing_connection = proj_client.connections.get(name=bing_connection_name)

print("Using Bing connection:", bing_connection.id)

mcp_tool_bing = BingGroundingAgentTool(
    bing_grounding=BingGroundingSearchToolParameters(
        search_configurations=[
            BingGroundingSearchConfiguration(project_connection_id=bing_connection.id)
        ]
    )
)

agent_version = proj_client.agents.create_version(
    agent_name=agent_name,
    definition=PromptAgentDefinition(
        model=agent_model,
        instructions=instructions,
        temperature=0.25,
        top_p=0.75,
        tools=[mcp_tool_db, mcp_tool_bing],
    )
)

print("Created agent version:", agent_version.version)

agent = proj_client.agents.get(agent_name=agent_name)

print(f"Retrieved agent: {agent.name}")

openai_client = proj_client.get_openai_client()

response = openai_client.responses.create(
    input=[{"role": "user", "content": "Who is Jay Emery?"}],
    extra_body={"agent": {"name": agent.name, "type": "agent_reference"}},
)

print(f"Response output: {response.output_text}")

response = openai_client.responses.create(
    input=[{"role": "user", "content": "What's the date?"}],
    extra_body={"agent": {"name": agent.name, "type": "agent_reference"}},
)

print(f"Response output: {response.output_text}")