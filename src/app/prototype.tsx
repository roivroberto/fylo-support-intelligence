'use client';

import React, { useState } from 'react';
import { 
  Inbox, 
  GitMerge, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  ArrowRight,
  Sparkles,
  BarChart3,
  UserCircle
} from 'lucide-react';

// --- MOCK DATA (Seeded from Backend/Data logic) ---
const mockTickets = [
  { id: 'T-1001', subject: 'Refund not processed after 5 days', category: 'Refunds', urgency: 'critical', tier: 'vip', confidence: 0.92, status: 'unassigned' },
  { id: 'T-1002', subject: 'Where is my order? Tracking broken', category: 'Shipping', urgency: 'medium', tier: 'standard', confidence: 0.88, status: 'unassigned' },
  { id: 'T-1003', subject: 'Received wrong item, need replacement ASAP', category: 'Returns', urgency: 'high', tier: 'standard', confidence: 0.55, status: 'unassigned' }, // Low confidence
  { id: 'T-1004', subject: 'Cannot log into my account', category: 'Technical', urgency: 'high', tier: 'vip', confidence: 0.85, status: 'unassigned' },
  { id: 'T-1005', subject: 'Update my shipping address', category: 'Account', urgency: 'low', tier: 'standard', confidence: 0.95, status: 'unassigned' },
  { id: 'T-1006', subject: 'Damaged box but item looks okay', category: 'Shipping', urgency: 'low', tier: 'standard', confidence: 0.62, status: 'unassigned' }, // Low confidence
];

const mockWorkers = [
  { id: 'W-01', name: 'Jessa M.', role: 'Specialist', skills: ['Refunds', 'VIP'], startingLoad: 3, capacity: 10 },
  { id: 'W-02', name: 'Paulo T.', role: 'Generalist', skills: ['Shipping', 'Account'], startingLoad: 6, capacity: 10 },
  { id: 'W-03', name: 'Mark D.', role: 'Team Lead', skills: ['Escalations', 'Technical'], startingLoad: 2, capacity: 8 },
];

const mockRouting = [
  { ticketId: 'T-1001', workerId: 'W-01', outcome: 'assigned', reviewRequired: false, reason: 'Best skill match (Refunds, VIP) with manageable workload.', priority: 'VIP Escalation' },
  { ticketId: 'T-1002', workerId: 'W-02', outcome: 'assigned', reviewRequired: false, reason: 'Primary skill match (Shipping) with available capacity.', priority: null },
  { ticketId: 'T-1003', workerId: null, outcome: 'review_queue', reviewRequired: true, reason: 'Confidence score (0.55) below 0.65 threshold. Requires lead review.', priority: null },
  { ticketId: 'T-1004', workerId: 'W-03', outcome: 'assigned', reviewRequired: false, reason: 'Escalated to Team Lead due to VIP status and Technical category.', priority: 'VIP Escalation' },
  { ticketId: 'T-1005', workerId: 'W-02', outcome: 'assigned', reviewRequired: false, reason: 'Generalist queue balanced routing.', priority: null },
  { ticketId: 'T-1006', workerId: null, outcome: 'review_queue', reviewRequired: true, reason: 'Confidence score (0.62) below 0.65 threshold. Ambiguous categorization.', priority: null },
];

const urgencyColors = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

// --- COMPONENTS ---

const Badge = ({ children, className = '' }) => (
  <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${className}`}>
    {children}
  </span>
);

export default function SharedShiftApp() {
  const [activeTab, setActiveTab] = useState('intake');

  const renderContent = () => {
    switch (activeTab) {
      case 'intake': return <IntakeScreen />;
      case 'routing': return <RoutingScreen />;
      case 'visibility': return <VisibilityScreen />;
      default: return <IntakeScreen />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      {/* Sidebar Nav */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <GitMerge className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">SharedShift</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">Explainable Routing Layer</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem 
            icon={<Inbox className="w-4 h-4" />} 
            label="Intake & Classify" 
            isActive={activeTab === 'intake'} 
            onClick={() => setActiveTab('intake')} 
          />
          <NavItem 
            icon={<GitMerge className="w-4 h-4" />} 
            label="Routing & Review" 
            isActive={activeTab === 'routing'} 
            onClick={() => setActiveTab('routing')} 
            badge="2"
          />
          <NavItem 
            icon={<Users className="w-4 h-4" />} 
            label="Work Distribution" 
            isActive={activeTab === 'visibility'} 
            onClick={() => setActiveTab('visibility')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2">
            <UserCircle className="w-8 h-8 text-slate-400" />
            <div>
              <p className="text-sm font-medium">Mark D.</p>
              <p className="text-xs text-slate-500">Team Lead</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Arena */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-slate-800">
            {activeTab === 'intake' && 'Queue Intake & Classification'}
            {activeTab === 'routing' && 'Routing Decisions'}
            {activeTab === 'visibility' && 'Contribution Visibility'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            AI Classification Active
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- SUB-SCREENS ---

function IntakeScreen() {
  const highCritical = mockTickets.filter(t => t.urgency === 'high' || t.urgency === 'critical').length;
  const vips = mockTickets.filter(t => t.tier === 'vip').length;
  const lowConf = mockTickets.filter(t => t.confidence < 0.65).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Total Tickets" value={mockTickets.length} icon={<Inbox />} />
        <MetricCard title="High / Critical" value={highCritical} icon={<AlertTriangle className="text-amber-500"/>} />
        <MetricCard title="VIP Customers" value={vips} icon={<Sparkles className="text-blue-500" />} />
        <MetricCard title="Low Confidence" value={lowConf} subtitle="Requires Review" icon={<ShieldAlert className="text-slate-400" />} />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Pre-Routing Queue</h3>
          <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            Execute Routing <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b border-slate-100 text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">Ticket</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Urgency</th>
              <th className="px-6 py-3 font-medium">Tier</th>
              <th className="px-6 py-3 font-medium">AI Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockTickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{ticket.id}</div>
                  <div className="text-slate-500 truncate max-w-xs">{ticket.subject}</div>
                </td>
                <td className="px-6 py-4">{ticket.category}</td>
                <td className="px-6 py-4">
                  <Badge className={urgencyColors[ticket.urgency]}>
                    {ticket.urgency.charAt(0).toUpperCase() + ticket.urgency.slice(1)}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  {ticket.tier === 'vip' ? (
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200">VIP</Badge>
                  ) : (
                    <span className="text-slate-500">Standard</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${ticket.confidence >= 0.65 ? 'bg-emerald-400' : 'bg-amber-400'}`} 
                        style={{ width: `${ticket.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className={`font-medium ${ticket.confidence >= 0.65 ? 'text-slate-700' : 'text-amber-600'}`}>
                      {Math.round(ticket.confidence * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoutingScreen() {
  const assignments = mockRouting.filter(r => r.outcome === 'assigned');
  const reviews = mockRouting.filter(r => r.outcome === 'review_queue');

  return (
    <div className="flex gap-6 animate-in fade-in duration-300 items-start">
      {/* Assignments Table (Left) */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Clear Assignments</h3>
          <p className="text-xs text-slate-500 mt-1">Tickets routed with confidence &gt; 65%</p>
        </div>
        <div className="divide-y divide-slate-100">
          {assignments.map(route => {
            const ticket = mockTickets.find(t => t.id === route.ticketId);
            const worker = mockWorkers.find(w => w.id === route.workerId);
            return (
              <div key={route.ticketId} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900">{route.ticketId}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                      <UserCircle className="w-3 h-3" /> {worker?.name}
                    </Badge>
                  </div>
                  {route.priority && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                      {route.priority}
                    </Badge>
                  )}
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800 mr-2">Reason:</span>
                  {route.reason}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Queue (Right) */}
      <div className="w-80 bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden shrink-0">
        <div className="px-5 py-4 border-b border-amber-100 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1">
            <AlertTriangle className="w-4 h-4" />
            Lead Review Queue
          </div>
          <p className="text-xs text-amber-600">Low confidence or edge cases</p>
        </div>
        <div className="divide-y divide-slate-100">
          {reviews.map(route => {
            const ticket = mockTickets.find(t => t.id === route.ticketId);
            return (
              <div key={route.ticketId} className="p-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-slate-900">{route.ticketId}</span>
                  <Badge className={urgencyColors[ticket.urgency]}>{ticket.urgency}</Badge>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{ticket?.subject}</p>
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 mb-3">
                  {route.reason}
                </div>
                <button className="w-full py-2 bg-white border border-slate-300 shadow-sm rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Review Ticket
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VisibilityScreen() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-2">Work Distribution Visibility</h3>
        <p className="text-slate-600 text-sm max-w-3xl">
          Overview of how work was distributed across the team. Routing rules prioritize balancing active workload with necessary skills, ensuring urgent cases are visible and no individual is overloaded.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {mockWorkers.map(worker => {
          // Calculate new assignments based on mock routing
          const newAssignments = mockRouting.filter(r => r.outcome === 'assigned' && r.workerId === worker.id);
          const newLoad = worker.startingLoad + newAssignments.length;
          const loadPercentage = (newLoad / worker.capacity) * 100;
          
          return (
            <div key={worker.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-slate-900 text-lg">{worker.name}</h4>
                  <p className="text-sm text-slate-500">{worker.role}</p>
                </div>
                <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                  {worker.skills[0]}
                </Badge>
              </div>
              
              <div className="p-5 flex-1">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-slate-600">Active Workload</span>
                  <span className="text-sm font-semibold text-slate-900">{newLoad} / {worker.capacity}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                  <div 
                    className={`h-full ${loadPercentage > 80 ? 'bg-amber-400' : 'bg-blue-500'}`}
                    style={{ width: `${loadPercentage}%` }}
                  ></div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Starting Load:</span>
                    <span className="font-medium">{worker.startingLoad} tickets</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">New Assignments:</span>
                    <span className="font-medium text-emerald-600">+{newAssignments.length} tickets</span>
                  </div>
                </div>
              </div>

              {newAssignments.length > 0 && (
                <div className="bg-slate-50 p-4 border-t border-slate-100 text-xs text-slate-600">
                  <span className="font-medium text-slate-800 block mb-1">Recent Route Note:</span>
                  "{newAssignments[0].reason}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- UTILS ---

function NavItem({ icon, label, isActive, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      {badge && (
        <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-blue-200 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function MetricCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-amber-600 font-medium mt-1">{subtitle}</p>}
      </div>
      <div className="p-2 bg-slate-50 rounded-lg">
        {icon}
      </div>
    </div>
  );
}