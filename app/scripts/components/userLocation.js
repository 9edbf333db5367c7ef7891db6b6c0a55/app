import { mapState } from 'vuex';
import throttle from 'lodash.throttle';


export default {
  template: '#user-location',
  data() {
    return {
      location: {
        homeArea: true,
      },
      locationOptions: [],
      searchingForLocation: false,
      googleMapsApiKey: 'AIzaSyAfMOwkBtFv53g76GJ-d4HugBFH_vym8s4',
      apiURL: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    };
  },
  computed: mapState({
    user: state => state.user,
    order: state => state.order,
    loading: 'loading',
    selectedDeliveryLocation: 'selectedDeliveryLocation',
  }),
  methods: {
    selectThisLocation(selectedPlaceId) {
      let deliveryLocation = this.locationOptions.filter(place => place.id === selectedPlaceId);
      deliveryLocation = deliveryLocation.length ? deliveryLocation[0] : null;

      const { geometry: { location: { lat: lat, lng: long } } } = deliveryLocation;
      deliveryLocation = Object.assign(deliveryLocation, { lat, long });
      this.$store.commit('setDeliveryLocation', deliveryLocation);
      console.log(deliveryLocation);

      $.post(`https://vitumob.xyz/cart/${this.order.order_hex}/location`, {
        delivery_location: JSON.stringify(deliveryLocation),
      }).done(response => {
        console.log(response);
      }).catch(error => {
        throw error;
      });
    },
    searchForLocation() {
      if (this.location.search && this.location.search.length >= 3) {
        const params = [
          'location=-1.3062641,36.777463',
          'radius=7500',
          `keyword=${this.location.search}`,
          `key=${this.googleMapsApiKey}`,
        ];

        const resourceURL = `${this.apiURL}?${params.join('&')}`;
        this.getPlacesFromGoogleMapsApi(resourceURL, this);
      }
    },
    getPlacesFromGoogleMapsApi: throttle((resourceURL, scope) => {
      scope.searchingForLocation = true;
      $.get(resourceURL).done(response => {
        console.log(response);
        scope.locationOptions = response.results;
        scope.searchingForLocation = false;
      });
    }, 1500, { trailing: true }),
  },
};
