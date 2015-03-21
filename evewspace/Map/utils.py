#   Eve W-Space
#   Copyright 2014 Andrew Austin and contributors
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
from collections import defaultdict
from core.models import SystemJump, Type, Location
from core.utils import get_config
from datetime import timedelta
from django.conf import settings
from django.contrib.sites.models import Site
from django.core.cache import cache
from django.db.models import Q
from math import pow, sqrt
import datetime
import json
import pytz

class MapJSONGenerator(object):
    """
    A MapJSONGenerator is instantiated with a map and user. It provides
    a method that returns the JSON representation of the map.
    """

    def __init__(self, map, user):
        self.map = map
        self.user = user
        self.pvp_threshold = int(get_config("MAP_PVP_THRESHOLD", user).value)
        self.npc_threshold = int(get_config("MAP_NPC_THRESHOLD", user).value)
        self.interest_time = int(get_config("MAP_INTEREST_TIME", user).value)

    def _get_interest_path(self):
        """
        Returns a list of MapSystems that are on the path to any system of
        interest
        """
        try:
            return self._interest_path
        except AttributeError:
            threshold = datetime.datetime.now(pytz.utc)\
                        - timedelta(minutes=self.interest_time)
            systems = []
            for system in self.map.systems.filter(
                interesttime__gt=threshold).iterator():
                systems.extend(self.get_path_to_map_system(system))
            self._interest_path = systems
            return systems

    @staticmethod
    def get_cache_key(map_inst):
        return '%s_map' % map_inst.pk

    def get_path_to_map_system(self, system):
        """
        Returns a list of MapSystems on the route between the map root and
        the provided MapSystem.
        """
        systemlist = []
        parent = system
        while parent:
            systemlist.append(parent)
            if parent.parentsystem and not parent.parent_wormhole.collapsed:
                parent = parent.parentsystem
            else:
                parent = None
        return systemlist

    def get_system_icon(self, system):
        """
        Takes a MapSystem and returns the appropriate icon to display on the map
        as a realative URL.
        """
        pvp_threshold = self.pvp_threshold
        npc_threshold = self.npc_threshold
        staticPrefix = "%s" % (settings.STATIC_URL + "images/")

        if system.system.stfleets.filter(ended__isnull=True).exists():
            return staticPrefix + "farm.png"

        if system.system.shipkills + system.system.podkills > pvp_threshold:
            return staticPrefix + "pvp.png"

        if system.system.npckills > npc_threshold:
            return staticPrefix + "carebears.png"

        return None

    def system_to_dict(self, system, levelX, levelY):
        """
        Takes a MapSystem and X,Y data and returns the dict of information to be passed to
        the map JS as JSON.
        """
        threshold = datetime.datetime.now(pytz.utc) - \
                    timedelta(minutes=self.interest_time)
        path = system in self._get_interest_path()
        system_obj = system.system
        is_wspace = system_obj.is_wspace()

        system_dict = {
            'sysID': system_obj.pk,
            'Name': system_obj.name,
            'LevelX': levelX,
            'LevelY': levelY,
            'SysClass': system_obj.sysclass,
            'Friendly': system.friendlyname,
            'interest': system.interesttime and \
                        system.interesttime > threshold,
            'interestpath': path,
            'activePilots': len(system_obj.pilot_list),
            'pilot_list': [x[1][1] for x in system_obj.pilot_list.items() \
                           if x[1][1] != "OOG Browser" ] ,
            'iconImageURL': self.get_system_icon(system),
            'msID': system.pk,
            'backgroundImageURL': self.get_system_background(system),
            'effect': system_obj.wsystem.effect if is_wspace else None,
            'importance': system_obj.importance,
            'shattered': system_obj.wsystem.is_shattered \
                         if is_wspace else False,
        }

        if system.parentsystem:
            parentWH = system.parent_wormhole
            system_dict.update({
                'ParentID': system.parentsystem.pk,
                'WhToParent': parentWH.bottom_type.name,
                'WhFromParent': parentWH.top_type.name,
                'WhMassStatus': parentWH.mass_status,
                'WhTimeStatus': parentWH.time_status,
                'WhTotalMass': parentWH.max_mass,
                'WhJumpMass': parentWH.jump_mass,
                'WhToParentBubbled': parentWH.bottom_bubbled,
                'WhFromParentBubbled': parentWH.top_bubbled,
                'whID': parentWH.pk,
                'collapsed': bool(parentWH.collapsed),
            })
        else:
            system_dict.update({
                'ParentID': None,
                'WhToParent': "",
                'WhFromParent': "",
                'WhTotalMass': None,
                'WhJumpMass': None,
                'WhMassStatus': None,
                'WhTimeStatus': None,
                'WhToParentBubbled': None,
                'WhFromParentBubbled': None,
                'whID': None,
                'collapsed': False,
            })

        return system_dict

    def get_system_background(self, system):
        """
        Takes a MapSystem and returns the appropriate background icon
        as a relative URL or None.
        """
        staticPrefix = "%s" % (settings.STATIC_URL + "images/")

        if system.system.importance == 0:
            return None
        if system.system.importance == 1:
            return staticPrefix + "skull.png"
        if system.system.importance == 2:
            return staticPrefix + "mark.png"
        raise ValueError


    def get_systems_json(self):
        """Returns a JSON string representing the systems in a map."""
        cache_key = self.get_cache_key(self.map)
        cached = cache.get(cache_key)
        if cached == None:
            self.systems = defaultdict(list)
            self.parents = dict()
            for system in self.map.systems.all()\
                    .select_related('system', 'parentsystem', 'parent_wormhole')\
                    .iterator():
                self.systems[system.parentsystem_id].append(system)
                self.parents[system.pk] = system.parentsystem_id
            cached = self.create_syslist()
            cache.set(cache_key, cached, 15)

        user_locations_dict = cache.get('user_%s_locations' % self.user.pk)
        if user_locations_dict:
            user_img = "%s/images/mylocation.png" % (settings.STATIC_URL)
            user_locations = [i[1][0] for i in user_locations_dict.items()]
            for system in cached:
                if system['sysID'] in user_locations and system['iconImageURL'] == None:
                    system['iconImageURL'] = user_img
        return json.dumps(cached, sort_keys=True)

    def create_syslist(self):
        """
        Return list of system dictionaries with appropriate x/y levels
        for map display.
        """
        root = self.systems[None][0]
        
        columns = []
        systems = { root.pk: root }
        todo = [(root.pk, 0, 0)]
        xs = dict()
        ys = dict()

        # insert systems into columns
        while len(todo) > 0:
            sys_id, x, y_min = todo.pop(0)
            if len(columns) <= x:
                columns.append([])
            xs[sys_id] = x
            column = columns[x]
            y = len(column)
            if y < y_min:
                column += [-1] * (y_min - y)
                y = y_min
            ys[sys_id] = y
            column.append(sys_id)
            for child in self.systems[sys_id]:
                systems[child.pk] = child
                todo.append((child.pk, x + 1, y))
        
        # adjust nodes to be at the same level as their first child
        for column in reversed(columns):
            for sys_id in column:
                if sys_id == -1:
                    continue
                parent_id = self.parents[sys_id]
                if parent_id is None:
                    continue
                if self.systems[parent_id][0].pk == sys_id:
                    y_parent = ys[parent_id]
                    dy = ys[sys_id] - y_parent
                    if dy > 0:
                        parent_column = columns[xs[parent_id]]
                        for i in parent_column[y_parent:]:
                            if i >= 0:
                                ys[i] += dy
                        for i in range(dy):
                            parent_column.insert(y_parent, -1)

        # create list of system dicts
        syslist = []
        for x, col in enumerate(columns):
            for y, sys_id in enumerate(col):
                if sys_id >= 0:
                    system_dict = self.system_to_dict(systems[sys_id], x, y)
                    syslist.append(system_dict)
        return syslist


def get_wormhole_type(system1, system2):
    """Gets the one-way wormhole types between system1 and system2."""
    from Map.models import WormholeType
    source = "K"
    destination = "K"
    # Set the source and destination for system1 > system2
    if system1.is_wspace:
        source = str(system1.sysclass)
    if system1.sysclass == 7:
        source = "H"
    if system1.sysclass in [8,9,10,11]:
        source = "NH"

    destination = system2.sysclass

    sourcewh = None

    if source == "H":
        if WormholeType.objects.filter(source="H",
                destination=destination).count() == 0:
            sourcewh = WormholeType.objects.filter(source="K",
                    destination=destination).all()
        else:
            sourcewh = WormholeType.objects.filter(source="H",
                    destination=destination).all()
    if source == "NH":
        if WormholeType.objects.filter(source="NH",
                destination=destination).count() == 0:
            sourcewh = WormholeType.objects.filter(source="K",
                    destination=destination).all()
        else:
            sourcewh = WormholeType.objects.filter(source="NH",
                    destination=destination).all()
    if source == "5" or source == "6":
        if WormholeType.objects.filter(source="Z",
                destination=destination).count() != 0:
            sourcewh = WormholeType.objects.filter(
                    Q(source="Z") | Q(source='W')).filter(
                            destination=destination).all()

    if sourcewh == None:
        sourcewh = WormholeType.objects.filter(Q(source=source) | Q(source='W')
                ).filter(destination=destination).all()
    return sourcewh


def get_possible_wh_types(system1, system2):
    """Takes two systems and gets the possible wormhole types between them.
    For example, given system1 as highsec and system2 as C2, it should return
    R943 and B274. system1 is the source and system2 is the destination.
    Results are returned as lists because some combinations have multiple possibilities.
    Returns a dict in the format {system1: [R943,], system2: [B274,]}.

    """

    # Get System1 > System2

    forward = get_wormhole_type(system1, system2)

    # Get Reverse

    reverse = get_wormhole_type(system2, system1)

    result = {'system1': forward, 'system2': reverse}

    return result


def convert_signature_id(sigid):
    """
    Standardize the signature ID to XXX-XXX if info is available.
    """
    escaped_sigid = sigid.replace(' ','').replace('-','').upper()
    if len(escaped_sigid) == 6:
        return "%s-%s" % (escaped_sigid[:3], escaped_sigid[3:])
    else:
        return sigid.upper()


class RouteFinder(object):
    """
    A RouteFinder object is created with two system objects and has methods
    for getting the shortest stargate jump route length, the light-year distance,
    and the shortest stargate route as a list of KSystem objects.
    """

    def __init__(self):
        from django.core.cache import cache
        if not cache.get('route_graph'):
            self._cache_graph()
        else:
            import cPickle
            self.graph = cPickle.loads(cache.get('route_graph'))

    def _get_ly_distance(self, sys1, sys2):
        """
        Gets the distance in light years between two systems.
        """
        x1 = sys1.x
        y1 = sys1.y
        z1 = sys1.z
        x2 = sys2.x
        y2 = sys2.y
        z2 = sys2.z

        distance = sqrt(pow(x1 - x2 ,2) + pow(y1-y2,2) + pow(z1-z2,2)) / 9.4605284e+15
        return distance

    def ly_distance(self, sys1, sys2):
        return self._get_ly_distance(sys1, sys2)

    def route_as_ids(self, sys1, sys2):
        return self._find_route(sys1, sys2)

    def route(self, sys1, sys2):
        from Map.models import KSystem
        return [KSystem.objects.get(pk=sysid) for sysid in self._find_route(sys1, sys2)]

    def route_length(self, sys1, sys2):
        return len(self._find_route(sys1, sys2))

    def _cache_graph(self):
        from Map.models import KSystem
        from core.models import SystemJump
        from django.core.cache import cache
        import cPickle
        import networkx as nx
        if not cache.get('route_graph'):
            graph = nx.Graph()
            for from_system in KSystem.objects.all():
                for to_system in SystemJump.objects.filter(fromsystem=from_system.pk):
                    graph.add_edge(from_system.pk, to_system.tosystem)
            cache.set('route_graph', cPickle.dumps(graph, cPickle.HIGHEST_PROTOCOL), 0)
            self.graph = graph

    def _find_route(self, sys1, sys2):
        """
        Takes two system objects (can be KSystem or SystemData).
        Returns a list of system IDs that comprise the route.
        """
        import networkx as nx
        import cPickle
        if not self.graph:
            if not cache.get('route_graph'):
                from django.core.cache import cache
                self._cache_graph()
                self.graph = cPickle.loads(cache.get('route_graph'))
            else:
                self.graph = cPickle.loads(cache.get('route_graph'))
        return nx.shortest_path(self.graph, source=sys1.pk, target=sys2.pk)
