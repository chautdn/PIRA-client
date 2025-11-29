import { formatDate } from '../../utils/disputeHelpers';

const DisputeTimeline = ({ dispute }) => {
  const getTimelineEvents = () => {
    const events = [
      {
        date: dispute.createdAt,
        title: 'Tranh chấp được tạo',
        description: `${dispute.complainant?.profile?.fullName || 'Người khiếu nại'} đã tạo tranh chấp`,
        color: 'blue'
      }
    ];

    if (dispute.respondentResponse?.respondedAt) {
      const decision = dispute.respondentResponse.decision;
      events.push({
        date: dispute.respondentResponse.respondedAt,
        title: decision === 'ACCEPTED' ? 'Chấp nhận' : 'Từ chối',
        description: `${dispute.respondent?.profile?.fullName || 'Người bị khiếu nại'} đã ${decision === 'ACCEPTED' ? 'chấp nhận' : 'từ chối'}`,
        color: decision === 'ACCEPTED' ? 'green' : 'red'
      });
    }

    if (dispute.adminDecision?.reviewDate) {
      events.push({
        date: dispute.adminDecision.reviewDate,
        title: 'Admin đã quyết định',
        description: `Admin đã xem xét và đưa ra quyết định`,
        color: 'purple'
      });
    }

    if (dispute.negotiationRoom?.startedAt) {
      events.push({
        date: dispute.negotiationRoom.startedAt,
        title: 'Bắt đầu đàm phán',
        description: 'Giai đoạn đàm phán 3 ngày',
        color: 'indigo'
      });
    }

    if (dispute.negotiationRoom?.endedAt) {
      events.push({
        date: dispute.negotiationRoom.endedAt,
        title: dispute.negotiationRoom.status === 'AGREED' ? 'Đàm phán thành công' : 'Đàm phán thất bại',
        description: dispute.negotiationRoom.status === 'AGREED' ? 'Hai bên đã đạt được thỏa thuận' : 'Không đạt được thỏa thuận',
        color: dispute.negotiationRoom.status === 'AGREED' ? 'green' : 'red'
      });
    }

    if (dispute.thirdPartyResolution?.escalatedAt) {
      events.push({
        date: dispute.thirdPartyResolution.escalatedAt,
        title: 'Chuyển bên thứ 3',
        description: 'Tranh chấp được chuyển cho bên thứ 3 xử lý',
        color: 'orange'
      });
    }

    if (dispute.resolution?.resolvedAt) {
      events.push({
        date: dispute.resolution.resolvedAt,
        title: 'Đã giải quyết',
        description: 'Tranh chấp đã được giải quyết',
        color: 'green'
      });
    }

    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const events = getTimelineEvents();

  const getColorClass = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      red: 'bg-red-100 text-red-800 border-red-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      orange: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử</h2>
      
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="relative">
            {index !== events.length - 1 && (
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
            )}
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 ${getColorClass(event.color)} flex items-center justify-center z-10`}>
                <div className="w-2 h-2 bg-current rounded-full" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-900">{event.title}</p>
                <p className="text-sm text-gray-600">{event.description}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(event.date)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisputeTimeline;
